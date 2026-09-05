package braseiro.ose.model

import kotlinx.serialization.Serializable

@Serializable enum class AttributeKey { STR, INT, WIS, DEX, CON, CHA }
@Serializable data class Attributes(
    val str: Int, val int: Int, val wis: Int, val dex: Int, val con: Int, val cha: Int
) {
    init { values().forEach { require(it in 3..18) } }
    fun get(key: AttributeKey): Int = when (key) {
        AttributeKey.STR -> str; AttributeKey.INT -> int; AttributeKey.WIS -> wis
        AttributeKey.DEX -> dex; AttributeKey.CON -> con; AttributeKey.CHA -> cha
    }
    fun with(key: AttributeKey, value: Int): Attributes = when (key) {
        AttributeKey.STR -> copy(str=value); AttributeKey.INT -> copy(int=value); AttributeKey.WIS -> copy(wis=value)
        AttributeKey.DEX -> copy(dex=value); AttributeKey.CON -> copy(con=value); AttributeKey.CHA -> copy(cha=value)
    }
    fun values() = listOf(str,int,wis,dex,con,cha)
}

@Serializable data class SavingThrows(
    val deathPoison: Int,
    val wands: Int,
    val paralysisPetrification: Int,
    val breath: Int,
    val spellsRodsStaves: Int
)

@Serializable data class HitPoints(
    val currentNumerator: Int,
    val maxNumerator: Int,
    val denominator: Int = 1
) {
    init { require(denominator > 0 && maxNumerator >= 1 && currentNumerator <= maxNumerator) }
    fun damage(points: Int): HitPoints = copy(currentNumerator = currentNumerator - points * denominator)
    fun heal(points: Int): HitPoints = copy(currentNumerator = minOf(maxNumerator, currentNumerator + points * denominator))
    val dead: Boolean get() = currentNumerator <= 0
    fun display(): String = if (denominator == 1) "$currentNumerator" else "$currentNumerator/$denominator"
}

@Serializable data class CharacterSnapshot(
    val characterId: String,
    val name: String,
    val creationMethod: String,
    val raceId: String,
    val classIds: List<String>,
    val levelByClass: Map<String, Int>,
    val xpByClass: Map<String, Long>,
    val attributes: Attributes,
    val hitPoints: HitPoints,
    val armorClassDescending: Int,
    val armorClassAscending: Int,
    val thac0: Int,
    val attackBonusAscending: Int,
    val savingThrows: SavingThrows,
    val languages: List<String> = emptyList(),
    val flags: Set<String> = emptySet(),
    val evidenceRefs: List<String> = emptyList()
) {
    init { require(characterId.isNotBlank()); require(name.isNotBlank()); require(classIds.isNotEmpty()) }
    fun canonical() = copy(
        classIds = classIds.distinct().sorted(),
        levelByClass = levelByClass.toSortedMap(),
        xpByClass = xpByClass.toSortedMap(),
        languages = languages.distinct().sorted(),
        flags = flags.toSortedSet(),
        evidenceRefs = evidenceRefs.distinct().sorted()
    )
}

@Serializable data class SessionSnapshot(
    val phase: String = "PRESTART",
    val visibleNarration: String = "",
    val visibleMechanicalFeedback: String = "",
    val lastPlayerReaction: String = "",
    val journal: List<String> = emptyList()
)

@Serializable data class DungeonNodeSnapshot(
    val nodeId: String,
    val kind: String,
    val secret: Boolean = false
)
@Serializable data class DungeonEdgeSnapshot(val from: String, val to: String, val kind: String = "PASSAGE", val secret: Boolean = false)
@Serializable data class DungeonSnapshot(
    val dungeonId: String,
    val generatorVersion: Int,
    val seed: ULong,
    val entranceNodeId: String,
    val nodes: List<DungeonNodeSnapshot>,
    val edges: List<DungeonEdgeSnapshot>,
    val knownNodeIds: Set<String> = setOf(),
    val visibleNodeIds: Set<String> = setOf()
) {
    fun canonical() = copy(
        nodes = nodes.sortedBy { it.nodeId },
        edges = edges.sortedWith(compareBy<DungeonEdgeSnapshot>({it.from},{it.to},{it.kind})),
        knownNodeIds = knownNodeIds.toSortedSet(),
        visibleNodeIds = visibleNodeIds.toSortedSet()
    )
}

@Serializable enum class TerrainKind { CLEAR_GRASSLANDS, HILLS, MOUNTAINS, FOREST, DESERT, SWAMP, JUNGLE, BARREN_ADV, BROKEN_LANDS_ADV }
@Serializable enum class HydrologyKind { NONE, LAKE_RIVER, SEA_OCEAN }
@Serializable data class HexCellSnapshot(
    val q: Int, val r: Int,
    val terrain: TerrainKind,
    val hydrology: HydrologyKind = HydrologyKind.NONE,
    val road: Boolean = false,
    val trail: Boolean = false,
    val poiId: String? = null,
    val known: Boolean = false,
    val visible: Boolean = false
)
@Serializable data class HexWorldSnapshot(
    val worldId: String,
    val generatorVersion: Int,
    val geometryVersion: Int,
    val seed: ULong,
    val width: Int,
    val height: Int,
    val cells: List<HexCellSnapshot>
) {
    fun canonical() = copy(cells = cells.sortedWith(compareBy<HexCellSnapshot>({it.r},{it.q})))
}

@Serializable data class SettlementLocationSnapshot(val locationId: String, val name: String, val discovered: Boolean = false, val tags: Set<String> = emptySet())
@Serializable data class SettlementSnapshot(
    val settlementId: String,
    val packageVersion: Int,
    val locations: List<SettlementLocationSnapshot>,
    val exits: Map<String, String> = emptyMap()
) {
    fun canonical() = copy(locations = locations.sortedBy { it.locationId }, exits = exits.toSortedMap())
}

@Serializable data class NpcSnapshot(
    val npcId: String,
    val name: String,
    val locationRef: String,
    val knownFactIds: Set<String> = emptySet(),
    val reactionHistory: List<String> = emptyList(),
    val memorySummaries: List<String> = emptyList(),
    val consequenceFlags: Set<String> = emptySet()
) {
    fun canonical() = copy(
        knownFactIds = knownFactIds.toSortedSet(),
        reactionHistory = reactionHistory.toList(),
        memorySummaries = memorySummaries.toList(),
        consequenceFlags = consequenceFlags.toSortedSet()
    )
}

@Serializable data class WorldEventSnapshot(
    val eventId: String,
    val dueTurn: Long,
    val kind: String,
    val targetId: String,
    val payload: String,
    val resolved: Boolean = false
)

@Serializable data class ActionLogEntry(
    val actionId: String,
    val channel: String,
    val text: String,
    val ruleEvidenceRefs: List<String> = emptyList(),
    val ruleEvidenceStatus: String = "",
    val ruleTraceNote: String = "",
    // Defaults true so action logs written by older schema versions are never replayed narratively.
    val narrativeCommitted: Boolean = true
)

@Serializable data class RngStateSnapshot(
    val state: String,
    val increment: String,
    val counter: Long,
    val version: String
)

@Serializable data class GameExtensions(
    val characters: Map<String, CharacterSnapshot> = emptyMap(),
    val session: SessionSnapshot = SessionSnapshot(),
    val dungeon: DungeonSnapshot? = null,
    val hexWorld: HexWorldSnapshot? = null,
    val settlement: SettlementSnapshot? = null,
    val npcs: Map<String, NpcSnapshot> = emptyMap(),
    val worldEvents: List<WorldEventSnapshot> = emptyList(),
    val actionLog: List<ActionLogEntry> = emptyList(),
    val rngRootSeed: String = "42",
    val rngStreams: Map<String, RngStateSnapshot> = emptyMap(),
    val revision: Long = 0
) {
    fun canonical() = copy(
        characters = characters.toSortedMap().mapValues { it.value.canonical() },
        dungeon = dungeon?.canonical(),
        hexWorld = hexWorld?.canonical(),
        settlement = settlement?.canonical(),
        npcs = npcs.toSortedMap().mapValues { it.value.canonical() },
        worldEvents = worldEvents.sortedWith(compareBy<WorldEventSnapshot>({it.dueTurn},{it.eventId})),
        actionLog = actionLog.toList(),
        rngStreams = rngStreams.toSortedMap()
    )
}
