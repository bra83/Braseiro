pluginManagement {
    repositories { google(); mavenCentral(); gradlePluginPortal() }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories { google(); mavenCentral() }
}
rootProject.name = "BraseiroOSE"
include(
    ":core-model",
    ":core-rng",
    ":campaign-domain",
    ":persistence-api",
    ":migration-registry",
    ":persistence-room",
    ":test-support",
    ":asset-resolver",
    ":app-android"
)
