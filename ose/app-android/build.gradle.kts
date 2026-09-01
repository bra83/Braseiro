plugins {
    id("com.android.application")
    kotlin("android")
}

android {
    namespace = "braseiro.ose.app"
    compileSdk = 35
    defaultConfig {
        applicationId = "braseiro.ose"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.2.0-batch-a"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    sourceSets["main"].assets.srcDir("../web-ui/dist")
    testOptions { unitTests.isIncludeAndroidResources = true }
}

kotlin { jvmToolchain(17) }

dependencies {
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test:core:1.6.1")
    androidTestImplementation("androidx.test:runner:1.6.2")
}
