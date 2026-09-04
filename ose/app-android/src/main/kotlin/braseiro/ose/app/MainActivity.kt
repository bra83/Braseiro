package braseiro.ose.app

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.webkit.*
import androidx.room.Room
import androidx.webkit.WebViewAssetLoader
import braseiro.ose.model.*
import braseiro.ose.persistence.api.*
import braseiro.ose.persistence.room.*
import braseiro.ose.rules.advanced.*
import braseiro.ose.rules.classic.*
import braseiro.ose.session.*
import braseiro.ose.tts.android.AndroidTtsAdapter
import java.util.concurrent.Executors
import org.json.JSONObject

class MainActivity : Activity() {
 companion object { const val LOCAL_APP_ORIGIN="https://appassets.androidplatform.net/assets/"; const val START_URL="${LOCAL_APP_ORIGIN}index.html?screen=session&state=active"; val CAMPAIGN_ID=CampaignId("braseiro-ose-primary") }
 private lateinit var webView:WebView; private lateinit var db:BraseiroOseDatabase; private lateinit var repository:RoomCampaignRepository; private lateinit var session:SessionEngine; private lateinit var tts:AndroidTtsAdapter
 private val io=Executors.newSingleThreadExecutor()
 @Volatile var lastBridgeMessage:BridgeEnvelopeMetadata?=null; private set
 @SuppressLint("SetJavaScriptEnabled") override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState)
  db=Room.databaseBuilder(applicationContext,BraseiroOseDatabase::class.java,"braseiro-ose.db").fallbackToDestructiveMigrationOnDowngrade().build();repository=RoomCampaignRepository(db)
  session=SessionEngine(repository,StrictRulesRouter(ClassicRulesEngine(),AdvancedRulesEngine()));tts=AndroidTtsAdapter(this)
  val loader=WebViewAssetLoader.Builder().addPathHandler("/assets/",WebViewAssetLoader.AssetsPathHandler(this)).build()
  webView=WebView(this).apply{settings.javaScriptEnabled=true;settings.allowFileAccess=false;settings.allowContentAccess=false;settings.domStorageEnabled=false;webViewClient=object:WebViewClient(){override fun shouldInterceptRequest(view:WebView?,request:WebResourceRequest)=loader.shouldInterceptRequest(request.url)};webChromeClient=WebChromeClient();addJavascriptInterface(BridgeEndpoint(),"BraseiroBridge")}
  setContentView(webView)
  io.execute { bootstrapIfMissing(); runOnUiThread { if(!isFinishing && !isDestroyed) webView.loadUrl(START_URL) } }
 }
 private fun bootstrapIfMissing(){if(repository.load(CAMPAIGN_ID) is CampaignLoadResult.NotFound){repository.create(CampaignEnvelope(campaignId=CAMPAIGN_ID,createdAtMetadata="bootstrap",ruleProfile=RuleProfile.OSE_ADVANCED_FANTASY,authorityRevision=AuthorityRevision("OSE_ADVANCED_INTERIM_CANONICAL","Referee-v1.2+Player","63ea8b2cbcb32b671a70118862a2ecd73c5f670a031914da0e94e6955acf57a1"),optionSet=OptionSet(listOf("OSE.OPTION.MORALE","OSE.OPTION.ENCUMBRANCE_BASIC")),generatorRegistry=GeneratorRegistry(listOf(GeneratorVersion("DUNGEON_GEN",1),GeneratorVersion("HEX_WORLD_GEN",1))),assetManifestRevision=AssetManifestRevision("BRASEIRO_VISUAL_FORGE_ASSET_MANIFEST_V2","2026-08-31","769fa3b9893dc8a4108646783740a0caaa9971c6f90fd44d6e9309792e7301e4"),campaignState=CampaignState(PartyState(),TimeState(turns=0),PositionState(SpatialRef.Hex("world-1",3,2)),ResourceState(listOf("torch:30m","rations:4","movement:90")),PlayerKnowledgeState(listOf("hex:3,2"))))) } }
 fun webViewForTest()=webView
 private inner class BridgeEndpoint {
  @JavascriptInterface fun postMessage(raw:String){io.execute { try{val meta=BridgeContractValidator.validate(raw);lastBridgeMessage=meta;val o=JSONObject(raw);val p=o.getJSONObject("payload");when(meta.type){
   "PlayerReaction"->{val id=p.optString("reactionId","reaction-${System.nanoTime()}");val text=p.optString("text","");val surface=runCatching{SessionSurface.valueOf(p.optString("surface","ACTIVE").uppercase())}.getOrDefault(SessionSurface.ACTIVE);val r=session.submitPlayerReaction(CAMPAIGN_ID,PlayerReaction(id,text,surface));send(JSONObject().put("type","SessionUpdate").put("payload",JSONObject().put("narration",r.narration.visibleText).put("feedback",r.visibleMechanicalSummary).put("committed",r.committed).put("stateHash",r.afterHash).put("timeTurns",current().campaignState.time.turns))) }
   "GMHelp"->{val r=session.gmHelp(CAMPAIGN_ID,p.optString("question",""));send(JSONObject().put("type","GMHelpResponse").put("payload",JSONObject().put("answer",r.answer).put("stateHash",r.afterHash))) }
   "TtsCommand"->{when(p.optString("command")){"play"->{tts.prepare(p.optString("visibleNarration"));tts.play()};"stop"->tts.stop()};send(JSONObject().put("type","TtsState").put("payload",JSONObject().put("ok",true))) }
   "ViewState"->{send(JSONObject().put("type","ViewState").put("payload",JSONObject().put("timeTurns",current().campaignState.time.turns).put("position",current().campaignState.position.primary.toString())))}
  }}catch(t:Throwable){send(JSONObject().put("type","BridgeError").put("payload",JSONObject().put("message",t.message?:t::class.java.simpleName)))}} }
 }
 private fun current()=when(val r=repository.load(CAMPAIGN_ID)){is CampaignLoadResult.Loaded->r.envelope;else->error("Campaign unavailable")}
 private fun send(obj:JSONObject){runOnUiThread{if(::webView.isInitialized){val quoted=JSONObject.quote(obj.toString());webView.evaluateJavascript("window.BraseiroReceive && window.BraseiroReceive($quoted);",null)}}}
 override fun onDestroy(){io.shutdownNow();if(::tts.isInitialized)tts.close();if(::db.isInitialized)db.close();if(::webView.isInitialized)webView.destroy();super.onDestroy()}
}
