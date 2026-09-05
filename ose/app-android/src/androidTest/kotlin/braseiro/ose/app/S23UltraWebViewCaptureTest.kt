package braseiro.ose.app

import android.graphics.Bitmap
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import java.io.FileOutputStream
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
        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            waitUntilReady(scenario)
            capture(scenario, "s23ultra_webview_01_session.png")

            navigate(scenario, "map")
            capture(scenario, "s23ultra_webview_02_map.png")

            navigate(scenario, "sheet")
            capture(scenario, "s23ultra_webview_03_sheet.png")

            navigate(scenario, "company")
            capture(scenario, "s23ultra_webview_04_company.png")
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
    }

    private fun navigate(scenario: ActivityScenario<MainActivity>, target: String) {
        val result = evaluateJavascript(
            scenario,
            "(function(){var a=document.querySelectorAll('[data-nav]');for(var i=0;i<a.length;i++){if(a[i].getAttribute('data-nav')==='$target'){a[i].click();return true;}}return false;})()"
        )
        assertEquals("true", result)
        Thread.sleep(700)
    }

    private fun capture(scenario: ActivityScenario<MainActivity>, fileName: String) {
        Thread.sleep(700)
        val bitmap: Bitmap = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        assertTrue(bitmap.width > 0 && bitmap.height > 0)
        scenario.onActivity { activity ->
            val dir = File(activity.filesDir, "s23-captures")
            check(dir.exists() || dir.mkdirs())
            FileOutputStream(File(dir, fileName)).use { stream ->
                check(bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream))
            }
        }
        bitmap.recycle()
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
