package braseiro.ose.persistence.room

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import braseiro.ose.model.*
import braseiro.ose.persistence.api.*
import org.junit.*
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

@RunWith(RobolectricTestRunner::class)
class RoomCampaignRepositoryTest {
    private lateinit var db: BraseiroOseDatabase
    private lateinit var repository: RoomCampaignRepository
    @Before fun setup() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        db = Room.inMemoryDatabaseBuilder(context, BraseiroOseDatabase::class.java).allowMainThreadQueries().build()
        repository = RoomCampaignRepository(db)
    }
    @After fun close() { if (db.isOpen) db.close() }
    private fun fixture(id: String = "c1") = CampaignEnvelope(1, CampaignId(id), "2026-09-01T00:00:00Z", RuleProfile.OSE_CLASSIC_FANTASY,
        AuthorityRevision("AUTH.CLASSIC", "v1", "h"), OptionSet(), GeneratorRegistry(), AssetManifestRevision("manifest", "v1", "h"),
        CampaignState(PartyState(), TimeState(), PositionState(SpatialRef.Hex("world", 0, 0))))

    @Test fun `create save load equality`() { val s = fixture(); repository.create(s); val r = repository.load(s.campaignId); assertIs<CampaignLoadResult.Loaded>(r); assertEquals(s, r.envelope) }
    @Test fun `sequential commits preserve latest state and audit`() {
        val s = fixture(); repository.create(s)
        repository.commit(s.campaignId, StateTransition("t1", s.campaignState.copy(time = TimeState(turns = 1))))
        repository.commit(s.campaignId, StateTransition("t2", s.campaignState.copy(time = TimeState(turns = 2))))
        val r = repository.load(s.campaignId) as CampaignLoadResult.Loaded
        assertEquals(2, r.envelope.campaignState.time.turns); assertEquals(2, db.campaignDao().auditCount(s.campaignId.value))
    }
    @Test fun `injected failure rolls back audit and update`() {
        val s = fixture(); repository.create(s); val failing = RoomCampaignRepository(db) { error("injected") }
        runCatching { failing.commit(s.campaignId, StateTransition("x", s.campaignState.copy(time = TimeState(turns = 1)))) }
        val r = repository.load(s.campaignId) as CampaignLoadResult.Loaded
        assertEquals(0, r.envelope.campaignState.time.turns); assertEquals(0, db.campaignDao().auditCount(s.campaignId.value))
    }
    @Test fun `read failure is typed and never creates blank campaign`() { val s = fixture(); repository.create(s); db.close(); assertIs<CampaignLoadResult.ReadFailure>(repository.load(s.campaignId)) }
    @Test fun `missing remains not found`() { assertIs<CampaignLoadResult.NotFound>(repository.load(CampaignId("missing"))); assertTrue(repository.listCampaigns().isEmpty()) }
}
