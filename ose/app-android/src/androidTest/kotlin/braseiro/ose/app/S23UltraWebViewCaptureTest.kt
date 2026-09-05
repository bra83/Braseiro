package braseiro.ose.app

import android.os.ParcelFileDescriptor
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
        shell("mkdir -p /sdcard/s23-captures")
        suppressSystemDialogs()

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

    private fun suppressSystemDialogs() {
        // Evidence screenshots must contain the app only. Emulator launcher ANR/crash
        // dialogs are host noise, not VTT UI, and invalidate a visual proof.
        shell("settings put secure immersive_mode_confirmations confirmed")
        shell("settings put global hide_error_dialogs 1")
        shell("settings put global show_first_crash_dialog 0")
        shell("settings put global show_restart_in_crash_dialog 0")
        shell("am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS")
        Thread.sleep(350)
    }

    private fun assertAppOwnsForeground() {
        suppressSystemDialogs()
        // UiAutomation.executeShellCommand does not execute shell metacharacters such as pipes.
        // Read the raw window dump and parse focus markers in-process instead.
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
        // Android WebView's compositor can commit a frame after the DOM/evaluateJavascript callback.
        // This delay is evidence synchronization, not a substitute for the WebView test itself.
        Thread.sleep(1800)
    }

    private fun capture(fileName: String) {
        InstrumentationRegistry.getInstrumentation().waitForIdleSync()
        Thread.sleep(500)
        assertAppOwnsForeground()
        shell("screencap -p /sdcard/s23-captures/$fileName")
        Thread.sleep(250)
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
