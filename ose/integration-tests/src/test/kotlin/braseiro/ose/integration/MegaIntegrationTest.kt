package braseiro.ose.integration
import braseiro.ose.model.*
import braseiro.ose.rules.api.*
import braseiro.ose.rules.classic.*
import braseiro.ose.rules.advanced.*
import braseiro.ose.character.*
import braseiro.ose.session.*
import braseiro.ose.testsupport.*
import braseiro.ose.dungeon.*
import braseiro.ose.hex.*
import braseiro.ose.map.settlement.*
import braseiro.ose.npc.*
import braseiro.ose.world.*
import braseiro.ose.backup.*
import kotlin.test.*

class MegaIntegrationTest {
 private val router=StrictRulesRouter(ClassicRulesEngine(),AdvancedRulesEngine())
 @Test fun `classic and advanced profiles are isolated and mechanically creatable`() {
  val cs=CharacterService(); val c=cs.create(CharacterCreationRequest("c","Classic",RuleProfile.OSE_CLASSIC_FANTASY,rolledAttributes=AttributeScores(15,9,9,13,12,10),classIds=listOf("FIGHTER"),hpRolls=listOf(6)));assertIs<RuleResult.Resolved<CharacterState>>(c)
  val a=cs.create(CharacterCreationRequest("a","Advanced",RuleProfile.OSE_ADVANCED_FANTASY,AdvancedCreationMethod.ADVANCED,AttributeScores(13,15,12,13,12,10),raceId="ELF",classIds=listOf("MAGIC_USER"),hpRolls=listOf(4)));assertIs<RuleResult.Resolved<CharacterState>>(a)
  assertFails{ClassicOnlyRouter().forProfile(RuleProfile.OSE_ADVANCED_FANTASY)}
 }
 @Test fun `33 long sessions keep GM_HELP zero delta and PLAYER_REACTION as only mutation`() {
  repeat(33){i->val repo=InMemoryCampaignRepository();val e=Fixtures.campaign("stress-$i",if(i%2==0)RuleProfile.OSE_CLASSIC_FANTASY else RuleProfile.OSE_ADVANCED_FANTASY);repo.create(e);val s=SessionEngine(repo,router);repeat(120){turn->val h=s.gmHelp(e.campaignId,"turn");assertEquals(h.beforeHash,h.afterHash);val r=s.submitPlayerReaction(e.campaignId,PlayerReaction("$i-$turn",if(turn%3==0)"descansar" else "observar"));if(turn%3==0)assertTrue(r.committed)else assertFalse(r.committed)};val final=(repo.load(e.campaignId) as braseiro.ose.persistence.api.CampaignLoadResult.Loaded).envelope;assertEquals(40,final.campaignState.time.turns)}
 }
 @Test fun `procedural maps settlement npc world and backup compose without position split`() {
  val hex=HexWorldGenerator().generate(HexWorldGenRequest("world",991,RuleProfile.OSE_ADVANCED_FANTASY));assertTrue(hex.coherencePassed)
  val dungeon=DungeonGenerator().generate(DungeonGenRequest("dungeon",992,16));assertTrue(DungeonValidator.validate(dungeon).pass)
  var state=CampaignState(PartyState(),TimeState(),PositionState(SpatialRef.Hex("world",3,2)),world=WorldState(hexWorlds=listOf(hex),dungeons=listOf(dungeon)))
  val pkg=AuthoredSettlementPackage("town",listOf(SettlementLocationState("gate","Gate",true),SettlementLocationState("inn","Inn")),mapOf("wild" to SpatialRef.Hex("world",3,2)));val ss=SettlementService();state=ss.install(state,pkg);state=ss.enter(state,"town","gate");assertIs<SpatialRef.Settlement>(state.position.primary)
  val npcs=(0 until 300).map{NpcState("n$it","NPC $it",SpatialRef.Settlement("town",if(it%2==0)"gate" else "inn"),knownFactIds=listOf("public-$it","secret-$it"),activeMissionIds=listOf("m$it"))};state=state.copy(world=state.world.copy(npcs=npcs,missions=npcs.mapIndexed{i,n->MissionState("m$i",n.npcId,"OPEN")},events=listOf(WorldEventState("ev",2,"NPC_TICK"))));state=NpcService().move(state,"n12",SpatialRef.Hex("world",1,1));assertEquals(300,state.world.npcs.size)
  val advanced=Fixtures.campaign("whole",RuleProfile.OSE_ADVANCED_FANTASY).copy(campaignState=state);val raw=BackupRestoreCodec.export(advanced);val restored=BackupRestoreCodec.validateAndDecode(raw);assertIs<RestoreValidation.Valid>(restored);assertEquals(advanced,restored.envelope)
 }
}
