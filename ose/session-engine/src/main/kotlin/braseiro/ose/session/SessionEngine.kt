package braseiro.ose.session

import braseiro.ose.barbara.BarbaraSupervisorPort
import braseiro.ose.model.*
import braseiro.ose.persistence.api.*
import braseiro.ose.referee.RefereeResolutionPort
import braseiro.ose.rng.*
import braseiro.ose.rules.api.RuleTrace
import braseiro.ose.world.WorldEventScheduler
import kotlinx.serialization.Serializable

@Serializable data class SessionResult(
    val campaignId: String,
    val narration: String,
    val feedback: String,
    val mechanicalMutation: Boolean,
    val trace: RuleTrace
)

@Serializable data class GMHelpResult(val answer: String, val stateRevision: Long)

class SessionEngine(
    private val repository: CampaignRepository,
    private val referee: RefereeResolutionPort,
    private val barbara: BarbaraSupervisorPort
) {
    fun submitPlayerReaction(campaignId: CampaignId, reaction: String): SessionResult {
        require(reaction.isNotBlank())
        val loaded=load(campaignId)
        val rng=restoreRng(loaded.campaignState.game)
        val outcome=referee.resolve(loaded,reaction,rng)
        val evidenceRefs=outcome.trace.evidence.map{it.ref()}
        val beforeGameRaw=outcome.updatedState.game
        val beforeTurn=loaded.campaignState.time.turns
        val afterTurn=outcome.updatedState.time.turns
        val beforeGame=if(afterTurn>beforeTurn) WorldEventScheduler.advance(beforeGameRaw,beforeTurn,afterTurn) else beforeGameRaw
        val firstGame=beforeGame.copy(
            session=beforeGame.session.copy(
                phase="ACTIVE",
                visibleMechanicalFeedback=outcome.feedback,
                lastPlayerReaction=reaction
            ),
            actionLog=beforeGame.actionLog+ActionLogEntry(
                actionId="action-${beforeGame.revision+1}",channel="PLAYER_REACTION",text=reaction,ruleEvidenceRefs=evidenceRefs
            ),
            rngRootSeed=rng.snapshot().rootSeed.toString(),
            rngStreams=snapshotRng(rng.snapshot()),
            revision=beforeGame.revision+1
        )
        val firstState=outcome.updatedState.copy(game=firstGame)
        repository.commit(campaignId,StateTransition("player-reaction-${firstGame.revision}",firstState))

        // Barbara receives only the already committed state/result. It cannot return mutations.
        val committed=load(campaignId)
        val narration=barbara.narrate(committed,reaction,outcome.feedback,outcome.trace)
        val committedGame=committed.campaignState.game
        val finalGame=committedGame.copy(
            session=committedGame.session.copy(
                phase="ACTIVE",
                visibleNarration=narration,
                journal=committedGame.session.journal + narration
            )
        )
        repository.commit(campaignId,StateTransition("narrative-projection-${committedGame.revision}",committed.campaignState.copy(game=finalGame)))
        return SessionResult(campaignId.value,narration,outcome.feedback,outcome.mechanicalMutation,outcome.trace)
    }

    fun gmHelp(campaignId: CampaignId, question: String): GMHelpResult {
        val before=load(campaignId)
        val revision=before.campaignState.game.revision
        val answer=barbara.help(before,question)
        val after=load(campaignId)
        check(after.campaignState.canonical()==before.campaignState.canonical()) { "GM_HELP_STATE_DELTA must be EMPTY" }
        return GMHelpResult(answer,revision)
    }

    fun loadSession(campaignId: CampaignId): CampaignEnvelope=load(campaignId)

    private fun load(id:CampaignId):CampaignEnvelope=when(val r=repository.load(id)){
        is CampaignLoadResult.Loaded->r.envelope
        is CampaignLoadResult.NotFound->error("Campaign not found: ${id.value}")
        is CampaignLoadResult.ReadFailure->throw IllegalStateException("Campaign read failure: ${id.value}",r.cause)
    }

    private fun restoreRng(game:GameExtensions):NamedRngStreams {
        if(game.rngStreams.isEmpty()) return NamedRngStreams.fromRootSeed(game.rngRootSeed.toULong())
        val streams=RngStreamId.entries.associateWith { id ->
            val s=game.rngStreams[id.name] ?: error("Missing persisted RNG stream ${id.name}")
            Pcg32State(s.state.toULong(),s.increment.toULong(),s.counter,s.version)
        }
        return NamedRngStreams.fromSeedState(SeedState(game.rngRootSeed.toULong(),streams))
    }
    private fun snapshotRng(seed:SeedState):Map<String,RngStateSnapshot> = seed.streams.mapKeys{it.key.name}.mapValues{(_,s)->RngStateSnapshot(s.state.toString(),s.increment.toString(),s.counter,s.version)}
}
