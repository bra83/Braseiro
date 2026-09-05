package braseiro.ose.app

import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class S23UltraWebViewCaptureTest {
    @Test
    fun capturePrimaryScreensFromRealAndroidWebView() {
        val ui = InstrumentationRegistry.getInstrumentation().uiAutomation
        ui.executeShellCommand("mkdir -p /sdcard/s23-captures").close()
        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            waitUntilReady(scenario)
            waitForVisualScreen(scenario, "session")
            capture("s23ultra_webview_01_session.png")

            navigate(scenario, "map")
            capture("s23ultra_webview_02_map.png")

            navigate(scenario, "sheet")
            capture("s23ultra_webview_03_sheet.png")

            navigate(scenario, "company")
            capture("s23ultra_webview_04_company.png")
        }
    }

    private fun waitUntilReady(scenario: ActivityScenario<MainActivity>) {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(30)
        var ready: String? = null
        while (System.nanoTime() < deadline && ready != "\"true\"") {
            ready = evaluateJavascript(scenario, "document.body && document.body.dataset.ready")
            if (ready != "\"true\"") Thread.sleep(100)
        }
        assertEquals("\"true\"", ready)
        val text = evaluateJavascript(scenario, "document.body.innerText.indexOf('CRIPTA SOB O OUTEIRO') >= 0")
        assertEquals("true", text)
    }

    private fun navigate(scenario: ActivityScenario<MainActivity>, target: String) {
        val result = evaluateJavascript(
            scenario,
            "(function(){var a=document.querySelectorAll('[data-nav]');for(var i=0;i<a.length;i++){if(a[i].getAttribute('data-nav')==='$target'){a[i].click();return true;}}return false;})()"
        )
        assertEquals("true", result)
        waitForVisualScreen(scenario, target)
    }

    private fun waitForVisualScreen(scenario: ActivityScenario<MainActivity>, target: String) {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10)
        var current: String? = null
        while (System.nanoTime() < deadline && current != "\"$target\"") {
            current = evaluateJavascript(
                scenario,
                "document.querySelector('#device') && document.querySelector('#device').dataset.screen"
            )
            if (current != "\"$target\"") Thread.sleep(80)
        }
        assertEquals("\"$target\"", current)
        scenario.onActivity { activity ->
            activity.webViewForTest().invalidate()
            activity.webViewForTest().requestLayout()
        }
        InstrumentationRegistry.getInstrumentation().waitForIdleSync()
        // Android WebView's compositor can commit a frame after the DOM/evaluateJavascript callback.
        // This delay is evidence synchronization, not a substitute for the WebView test itself.
        Thread.sleep(1800)
    }

    private fun capture(fileName: String) {
        InstrumentationRegistry.getInstrumentation().waitForIdleSync()
        Thread.sleep(500)
        val pfd = InstrumentationRegistry.getInstrumentation().uiAutomation
            .executeShellCommand("screencap -p /sdcard/s23-captures/$fileName")
        pfd.close()
        Thread.sleep(250)
    }

    private fun evaluateJavascript(
        scenario: ActivityScenario<MainActivity>,
        script: String
    ): String? {
        val latch = CountDownLatch(1)
        var result: String? = null
        scenario.onActivity { activity ->
            activity.webViewForTest().evaluateJavascript(script) { value ->
                result = value
                latch.countDown()
            }
        }
        assertTrue("evaluateJavascript callback timed out", latch.await(3, TimeUnit.SECONDS))
        return result
    }
}
