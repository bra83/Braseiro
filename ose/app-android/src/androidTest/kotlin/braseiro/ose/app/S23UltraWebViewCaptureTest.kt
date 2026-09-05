package braseiro.ose.app

import android.graphics.Bitmap
import android.os.Handler
import android.os.Looper
import android.os.ParcelFileDescriptor
import android.view.PixelCopy
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
        suppressSystemDialogs()

        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            waitUntilReady(scenario)
            waitForVisualScreen(scenario, "session")
            captureAppWindow(scenario, "s23ultra_webview_01_session.png")

            navigate(scenario, "map")
            captureAppWindow(scenario, "s23ultra_webview_02_map.png")

            navigate(scenario, "sheet")
            captureAppWindow(scenario, "s23ultra_webview_03_sheet.png")

            navigate(scenario, "company")
            captureAppWindow(scenario, "s23ultra_webview_04_company.png")
        }
    }

    private fun suppressSystemDialogs() {
        shell("settings put secure immersive_mode_confirmations confirmed")
        shell("settings put global hide_error_dialogs 1")
        shell("settings put global show_first_crash_dialog 0")
        shell("settings put global show_restart_in_crash_dialog 0")
        shell("am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS")
        Thread.sleep(350)
    }

    private fun assertAppOwnsForeground() {
        suppressSystemDialogs()
        val windowDump = shell("dumpsys window")
        val focus = windowDump.lineSequence()
            .filter {
                it.contains("mCurrentFocus") ||
                    it.contains("mFocusedApp") ||
                    it.contains("topResumedActivity")
            }
            .joinToString("\n")
        assertTrue(
            "Capture blocked by system/foreign window: $focus",
            focus.contains("braseiro.ose.app")
        )
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
        Thread.sleep(1800)
    }

    private fun captureAppWindow(
        scenario: ActivityScenario<MainActivity>,
        fileName: String
    ) {
        InstrumentationRegistry.getInstrumentation().waitForIdleSync()
        Thread.sleep(500)
        assertAppOwnsForeground()

        val latch = CountDownLatch(1)
        var copyResult = PixelCopy.ERROR_UNKNOWN
        var saved = false
        scenario.onActivity { activity ->
            val decor = activity.window.decorView
            val width = decor.width
            val height = decor.height
            assertTrue("Window has invalid capture size ${width}x${height}", width > 0 && height > 0)
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            PixelCopy.request(
                activity.window,
                bitmap,
                { result ->
                    copyResult = result
                    if (result == PixelCopy.SUCCESS) {
                        val dir = File(activity.filesDir, "s23-captures")
                        dir.mkdirs()
                        FileOutputStream(File(dir, fileName)).use { out ->
                            saved = bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                        }
                    }
                    bitmap.recycle()
                    latch.countDown()
                },
                Handler(Looper.getMainLooper())
            )
        }
        assertTrue("PixelCopy callback timed out for $fileName", latch.await(8, TimeUnit.SECONDS))
        assertEquals("PixelCopy failed for $fileName", PixelCopy.SUCCESS, copyResult)
        assertTrue("PNG write failed for $fileName", saved)
    }

    private fun shell(command: String): String {
        val pfd = InstrumentationRegistry.getInstrumentation().uiAutomation.executeShellCommand(command)
        return ParcelFileDescriptor.AutoCloseInputStream(pfd).bufferedReader().use { it.readText() }
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
