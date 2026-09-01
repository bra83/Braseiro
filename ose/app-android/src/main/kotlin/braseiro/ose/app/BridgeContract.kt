package braseiro.ose.app

import org.json.JSONObject

const val BRIDGE_VERSION = 1
private val ALLOWED_BRIDGE_TYPES = setOf("ViewState", "UiCommand", "CaptureFixtureCommand")

data class BridgeEnvelopeMetadata(val version: Int, val type: String)

object BridgeContractValidator {
    fun validate(raw: String): BridgeEnvelopeMetadata {
        val obj = JSONObject(raw)
        val version = obj.optInt("version", -1)
        val type = obj.optString("type", "")
        require(version == BRIDGE_VERSION) { "Unsupported bridge version $version" }
        require(type in ALLOWED_BRIDGE_TYPES) { "Unsupported bridge type $type" }
        require(obj.has("payload")) { "Bridge payload missing" }
        return BridgeEnvelopeMetadata(version, type)
    }
}
