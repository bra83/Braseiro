package braseiro.ose.app

import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class WebViewSmokeTest {
    @Test fun localBundleLoadsAndBridgeReceivesViewState() {
        val latch = CountDownLatch(1)
        var ready: String? = null
        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            scenario.onActivity { activity ->
                activity.webViewForTest().evaluateJavascript("document.body.dataset.ready") { value ->
                    ready = value
                    latch.countDown()
                }
            }
            // GitHub's Linux runner has no KVM access, so API 35 runs under software
            // emulation and WebView's renderer can take substantially longer to service
            // evaluateJavascript. Keep the functional assertions unchanged; only give the
            // renderer enough time to answer on the required no-acceleration CI path.
            assertTrue(latch.await(120, TimeUnit.SECONDS))
            assertEquals("\"true\"", ready)
            scenario.onActivity { activity ->
                assertEquals(BridgeEnvelopeMetadata(1, "ViewState"), activity.lastBridgeMessage)
            }
        }
    }
}