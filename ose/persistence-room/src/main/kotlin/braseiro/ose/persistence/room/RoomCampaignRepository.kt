package braseiro.ose.persistence.room

import braseiro.ose.model.CampaignEnvelope
import braseiro.ose.model.CampaignId
import braseiro.ose.persistence.api.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class RoomCampaignRepository(
    private val db: BraseiroOseDatabase,
    private val commitFailureInjector: (() -> Unit)? = null,
    private val readFailureInjector: (() -> Unit)? = null
) : CampaignRepository {
    private val dao = db.campaignDao()
    private val json = Json { encodeDefaults = true; explicitNulls = false; classDiscriminator = "kind"; ignoreUnknownKeys = false }

    override fun create(envelope: CampaignEnvelope) = dao.insertCampaign(CampaignEntity(envelope.campaignId.value, json.encodeToString(envelope))).let { }

    override fun load(campaignId: CampaignId): CampaignLoadResult = try {
        readFailureInjector?.invoke()
        val entity = dao.findCampaign(campaignId.value) ?: return CampaignLoadResult.NotFound(campaignId)
        CampaignLoadResult.Loaded(json.decodeFromString<CampaignEnvelope>(entity.envelopeJson))
    } catch (t: Throwable) {
        CampaignLoadResult.ReadFailure(campaignId, t)
    }

    override fun commit(campaignId: CampaignId, transition: StateTransition) {
        db.runInTransaction {
            val current = dao.findCampaign(campaignId.value) ?: error("Campaign not found: ${campaignId.value}")
            val envelope = json.decodeFromString<CampaignEnvelope>(current.envelopeJson)
            val nextSequence = current.commitSequence + 1
            val updated = envelope.copy(campaignState = transition.updatedState)
            dao.insertAudit(ActionAuditEntity(campaignId = campaignId.value, transitionId = transition.transitionId, sequence = nextSequence))
            commitFailureInjector?.invoke()
            check(dao.updateState(campaignId.value, json.encodeToString(updated), nextSequence) == 1)
        }
    }

    override fun checkpoint(campaignId: CampaignId, checkpointId: String) {
        db.runInTransaction {
            val current = dao.findCampaign(campaignId.value) ?: error("Campaign not found: ${campaignId.value}")
            dao.insertCheckpoint(CheckpointEntity(checkpointId, campaignId.value, current.commitSequence))
        }
    }

    override fun listCampaigns(): List<CampaignSummary> = dao.listCampaigns().map { CampaignSummary(CampaignId(it.campaignId), it.archived) }
    override fun archive(campaignId: CampaignId) { check(dao.archive(campaignId.value) == 1) }
}
