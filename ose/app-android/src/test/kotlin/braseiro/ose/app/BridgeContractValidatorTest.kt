package braseiro.ose.app

import org.junit.Assert.assertEquals
import org.junit.Test

class BridgeContractValidatorTest {
    @Test fun acceptsVersionedPresentationContracts() {
        for (type in listOf("ViewState", "UiCommand", "CaptureFixtureCommand")) {
            assertEquals(BridgeEnvelopeMetadata(1, type), BridgeContractValidator.validate("{\"version\":1,\"type\":\"$type\",\"payload\":{}}"))
        }
    }

    @Test(expected = IllegalArgumentException::class)
    fun rejectsWrongVersion() { BridgeContractValidator.validate("{\"version\":2,\"type\":\"ViewState\",\"payload\":{}}") }

    @Test(expected = IllegalArgumentException::class)
    fun rejectsRulesEngineExposure() { BridgeContractValidator.validate("{\"version\":1,\"type\":\"RulesEngine\",\"payload\":{}}") }
}
