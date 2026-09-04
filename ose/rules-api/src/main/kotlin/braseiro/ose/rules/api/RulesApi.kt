package braseiro.ose.rules.api

import braseiro.ose.model.*
import kotlinx.serialization.Serializable

@Serializable data class RuleEvidence(
    val ruleId: String,
    val profile: RuleProfile,
    val source: String,
    val location: String
) {
    fun ref(): String = "$ruleId|${profile.name}|$source|$location"
}

@Serializable enum class EvidenceStatus { CANONICAL_RULE, CANONICAL_PROCEDURE, OPTIONAL_RULE, PRODUCT_PRESET, REFEREE_JUDGMENT, MISSING_EVIDENCE }

@Serializable data class RuleTrace(
    val status: EvidenceStatus,
    val evidence: List<RuleEvidence>,
    val note: String = ""
)

@Serializable enum class CreationMethod { CLASSIC, ADVANCED_BASIC, ADVANCED_METHOD }
@Serializable data class AttributeAdjustment(val decrease: AttributeKey, val increase: AttributeKey)

@Serializable data class CharacterCreationRequest(
    val profile: RuleProfile,
    val method: CreationMethod,
    val characterId: String,
    val name: String,
    val rolledAttributes: Attributes,
    val classIds: List<String>,
    val raceId: String? = null,
    val adjustments: List<AttributeAdjustment> = emptyList(),
    val hpRolls: List<Int>,
    val optionIds: Set<String> = emptySet(),
    val allowNpcOnlyCombination: Boolean = false
)

@Serializable enum class CreationFailureCode {
    PROFILE_METHOD_MISMATCH,
    UNKNOWN_CLASS,
    UNKNOWN_RACE,
    CLASS_PREREQUISITE,
    RACE_PREREQUISITE,
    RACE_CLASS_ILLEGAL,
    NPC_ONLY_COMBINATION,
    MULTICLASS_OPTION_REQUIRED,
    TOO_MANY_CLASSES,
    HP_ROLL_INVALID,
    ATTRIBUTE_ADJUSTMENT_ILLEGAL,
    MISSING_EVIDENCE
}

@Serializable sealed class CharacterCreationResult {
    @Serializable data class Created(val character: CharacterSnapshot, val trace: RuleTrace) : CharacterCreationResult()
    @Serializable data class Rejected(val code: CreationFailureCode, val detail: String, val trace: RuleTrace) : CharacterCreationResult()
}

@Serializable data class ClassLevelOneDescriptor(
    val classId: String,
    val hitDie: Int,
    val thac0: Int,
    val attackBonusAscending: Int,
    val saves: SavingThrows,
    val primary: Set<AttributeKey>,
    val minimums: Map<AttributeKey, Int>,
    val basicRaceId: String,
    val evidence: RuleEvidence
)

@Serializable data class RaceDescriptor(
    val raceId: String,
    val minimums: Map<AttributeKey, Int>,
    val modifiers: Map<AttributeKey, Int>,
    val allowedClassMaxLevel: Map<String, Int>,
    val npcOnlyClasses: Set<String>,
    val evidence: RuleEvidence
)

interface CharacterRulesProvider {
    val profile: RuleProfile
    fun create(request: CharacterCreationRequest): CharacterCreationResult
}

@Serializable enum class AttackArmorMode { DESCENDING, ASCENDING }
@Serializable data class AttackInput(
    val d20: Int,
    val mode: AttackArmorMode,
    val thac0: Int,
    val attackBonusAscending: Int,
    val targetArmorClass: Int,
    val modifier: Int = 0
)
@Serializable data class AttackResult(val hit: Boolean, val natural: Int, val total: Int, val target: Int, val trace: RuleTrace)
@Serializable data class SaveResult(val success: Boolean, val roll: Int, val target: Int, val trace: RuleTrace)
@Serializable data class AbilityCheckResult(val success: Boolean, val roll: Int, val modifiedRoll: Int, val attribute: Int, val trace: RuleTrace)
@Serializable data class DamageResult(val damage: Int, val trace: RuleTrace)

object OptionIds {
    const val ASCENDING_ARMOR_CLASS = "ASCENDING_ARMOR_CLASS"
    const val VARIABLE_WEAPON_DAMAGE = "VARIABLE_WEAPON_DAMAGE"
    const val INDIVIDUAL_INITIATIVE = "INDIVIDUAL_INITIATIVE"
    const val MORALE = "MORALE"
    const val REROLL_LOW_HP = "REROLL_LOW_HP"
    const val MULTICLASS = "MULTICLASS"
    const val WEAPON_PROFICIENCY = "WEAPON_PROFICIENCY"
    const val WEAPON_SPECIALIZATION = "WEAPON_SPECIALIZATION"
    const val SECONDARY_SKILLS = "SECONDARY_SKILLS"
}
