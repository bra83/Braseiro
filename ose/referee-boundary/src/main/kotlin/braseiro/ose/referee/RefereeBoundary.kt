package braseiro.ose.referee

import braseiro.ose.model.*
import braseiro.ose.rng.NamedRngStreams
import braseiro.ose.rng.RngStreamId
import braseiro.ose.rules.api.*
import braseiro.ose.rules.shared.SharedConfirmedRules
import kotlinx.serialization.Serializable

@Serializable data class ResolutionOutcome(
    val updatedState: CampaignState,
    val feedback: String,
    val trace: RuleTrace,
    val mechanicalMutation: Boolean,
    val rngConsumed: Boolean = false
)

interface RefereeResolutionPort {
    fun resolve(envelope: CampaignEnvelope, reactionText: String, rng: NamedRngStreams): ResolutionOutcome
}

class RulesRefereeBoundary : RefereeResolutionPort {
    override fun resolve(envelope: CampaignEnvelope, reactionText: String, rng: NamedRngStreams): ResolutionOutcome {
        val text=reactionText.trim()
        if(text.equals("WAIT_TURN",ignoreCase=true)) {
            val before=envelope.campaignState.time
            val after=advanceTurns(before,1)
            return ResolutionOutcome(envelope.campaignState.copy(time=after),"1 turno (10 minutos) transcorrido.",trace(envelope.ruleProfile,"TIME.TURN","GAME_SYSTEM_SPEC §12: 1 turno = 10 min; 6 turnos = 1 hora"),true)
        }
        if(text.equals("ROLL_D20",ignoreCase=true)) {
            val roll=(rng.draw(RngStreamId.RULES_DICE)%20u).toInt()+1
            return ResolutionOutcome(envelope.campaignState,"d20: $roll",RuleTrace(EvidenceStatus.REFEREE_JUDGMENT,emptyList(),"die roll only; no rule context supplied"),false,true)
        }
        val parts=text.split(':')
        if(parts.isNotEmpty()) when(parts[0].uppercase()) {
            "ABILITY" -> if(parts.size>=4) {
                val key=runCatching{AttributeKey.valueOf(parts[1].uppercase())}.getOrNull()
                val activeCharacter=envelope.campaignState.game.characters.values.firstOrNull()
                if(key!=null && activeCharacter!=null) {
                    val roll=parts[2].toIntOrNull(); val mod=parts[3].toIntOrNull()
                    if(roll!=null&&mod!=null) {
                        val r=SharedConfirmedRules.abilityCheck(envelope.ruleProfile,roll,activeCharacter.attributes.get(key),mod)
                        return ResolutionOutcome(envelope.campaignState,"Teste de ${key.name}: ${if(r.success)"sucesso" else "falha"} (${r.modifiedRoll} vs ${r.attribute}).",r.trace,false)
                    }
                }
            }
            "SAVE" -> if(parts.size>=3) {
                val target=parts[1].toIntOrNull(); val roll=parts[2].toIntOrNull()
                if(target!=null&&roll!=null){ val r=SharedConfirmedRules.savingThrow(envelope.ruleProfile,roll,target); return ResolutionOutcome(envelope.campaignState,"Jogada de proteção: ${if(r.success)"sucesso" else "falha"} ($roll vs $target).",r.trace,false) }
            }
            "ATTACK_DESC" -> if(parts.size>=5) {
                val th=parts[1].toIntOrNull();val ac=parts[2].toIntOrNull();val roll=parts[3].toIntOrNull();val mod=parts[4].toIntOrNull()
                if(listOf(th,ac,roll,mod).all{it!=null}){ val r=SharedConfirmedRules.attack(envelope.ruleProfile,AttackInput(roll!!,AttackArmorMode.DESCENDING,th!!,0,ac!!,mod!!));return ResolutionOutcome(envelope.campaignState,"Ataque: ${if(r.hit)"acerto" else "erro"}.",r.trace,false) }
            }
            "ATTACK_ASC" -> if(parts.size>=5) {
                val bonus=parts[1].toIntOrNull();val ac=parts[2].toIntOrNull();val roll=parts[3].toIntOrNull();val mod=parts[4].toIntOrNull()
                if(listOf(bonus,ac,roll,mod).all{it!=null}){ val r=SharedConfirmedRules.attack(envelope.ruleProfile,AttackInput(roll!!,AttackArmorMode.ASCENDING,19,bonus!!,ac!!,mod!!));return ResolutionOutcome(envelope.campaignState,"Ataque CAA: ${if(r.hit)"acerto" else "erro"}.",r.trace,false) }
            }
        }
        return ResolutionOutcome(envelope.campaignState,"A intenção requer arbitragem contextual do Mestre; nenhuma mecânica foi inventada.",RuleTrace(EvidenceStatus.REFEREE_JUDGMENT,emptyList(),"Free text without a proven specific procedure is not converted into a universal skill/check system."),false)
    }

    private fun trace(profile:RuleProfile,id:String,note:String)=RuleTrace(EvidenceStatus.CANONICAL_RULE,listOf(RuleEvidence(id,profile,"GAME_SYSTEM_SPEC.md",note)))
    private fun advanceTurns(t:TimeState,n:Long):TimeState {
        require(n>=0)
        val newTurns=t.turns+n
        val crossedHours=newTurns/6 - t.turns/6
        val newHours=t.hours+crossedHours
        val crossedDays=newHours/24 - t.hours/24
        return t.copy(turns=newTurns,hours=newHours,days=t.days+crossedDays)
    }
}
