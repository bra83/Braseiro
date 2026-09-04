package braseiro.ose.rules.shared

import braseiro.ose.model.RuleProfile
import braseiro.ose.rules.api.*
import kotlin.math.max

object SharedEvidence {
    fun attributes(profile: RuleProfile) = RuleEvidence(
        "SHARED.ATTR.MODIFIERS", profile,
        if (profile == RuleProfile.OSE_CLASSIC_FANTASY) "Classic Rules Tome" else "Advanced Player's Tome",
        if (profile == RuleProfile.OSE_CLASSIC_FANTASY) "pp.16-17" else "attribute tables audited in GAME_SYSTEM_SPEC §5.2"
    )
    fun attack(profile: RuleProfile) = RuleEvidence("RESOLVE.D20.ROLL_HIGH_ATTACK", profile,
        if (profile == RuleProfile.OSE_CLASSIC_FANTASY) "Classic Rules Tome" else "Advanced Referee/Player Tome",
        "GAME_SYSTEM_SPEC §§11,23-24")
    fun save(profile: RuleProfile) = RuleEvidence("RESOLVE.D20.ROLL_HIGH_SAVE", profile,
        if (profile == RuleProfile.OSE_CLASSIC_FANTASY) "Classic Rules Tome" else "Advanced Referee/Player Tome",
        "GAME_SYSTEM_SPEC §§11,27")
    fun ability(profile: RuleProfile) = RuleEvidence("RESOLVE.D20.ROLL_UNDER_ATTR", profile,
        if (profile == RuleProfile.OSE_CLASSIC_FANTASY) "Classic Rules Tome" else "Advanced Referee/Player Tome",
        "GAME_SYSTEM_SPEC §11.1; Classic p.114 / Advanced audited equivalent")
    fun damage(profile: RuleProfile) = RuleEvidence("DAMAGE.BASIC", profile,
        if (profile == RuleProfile.OSE_CLASSIC_FANTASY) "Classic Rules Tome" else "Advanced Referee/Player Tome",
        "GAME_SYSTEM_SPEC §25")
}

object SharedConfirmedRules {
    fun attributeModifier(score: Int): Int {
        require(score in 3..18)
        return when (score) {
            3 -> -3
            in 4..5 -> -2
            in 6..8 -> -1
            in 9..12 -> 0
            in 13..15 -> 1
            in 16..17 -> 2
            18 -> 3
            else -> error("unreachable")
        }
    }

    fun descendingArmorClass(base: Int = 9, dexterity: Int): Int = base - attributeModifier(dexterity)
    fun ascendingArmorClass(base: Int = 10, dexterity: Int): Int = base + attributeModifier(dexterity)

    fun attack(profile: RuleProfile, input: AttackInput): AttackResult {
        require(input.d20 in 1..20)
        val evidence = SharedEvidence.attack(profile)
        if (input.d20 == 1) return AttackResult(false, 1, 1, input.targetArmorClass, RuleTrace(EvidenceStatus.CANONICAL_RULE, listOf(evidence), "natural 1 misses"))
        if (input.d20 == 20) return AttackResult(true, 20, 20, input.targetArmorClass, RuleTrace(EvidenceStatus.CANONICAL_RULE, listOf(evidence), "natural 20 hits"))
        return when (input.mode) {
            AttackArmorMode.DESCENDING -> {
                val required = input.thac0 - input.targetArmorClass
                val total = input.d20 + input.modifier
                AttackResult(total >= required, input.d20, total, required, RuleTrace(EvidenceStatus.CANONICAL_RULE, listOf(evidence)))
            }
            AttackArmorMode.ASCENDING -> {
                val total = input.d20 + input.attackBonusAscending + input.modifier
                AttackResult(total >= input.targetArmorClass, input.d20, total, input.targetArmorClass,
                    RuleTrace(EvidenceStatus.OPTIONAL_RULE, listOf(evidence), "ascending AC active only when campaign option enables it"))
            }
        }
    }

    fun savingThrow(profile: RuleProfile, roll: Int, target: Int): SaveResult {
        require(roll in 1..20); require(target >= 2)
        return SaveResult(roll >= target, roll, target, RuleTrace(EvidenceStatus.CANONICAL_RULE, listOf(SharedEvidence.save(profile))))
    }

    fun abilityCheck(profile: RuleProfile, roll: Int, attribute: Int, difficultyModifier: Int = 0): AbilityCheckResult {
        require(roll in 1..20); require(attribute in 3..18)
        val success = when (roll) { 1 -> true; 20 -> false; else -> roll + difficultyModifier <= attribute }
        return AbilityCheckResult(success, roll, roll + difficultyModifier, attribute,
            RuleTrace(EvidenceStatus.CANONICAL_RULE, listOf(SharedEvidence.ability(profile))))
    }

    fun basicPlayerDamage(profile: RuleProfile, d6: Int, strengthModifier: Int = 0): DamageResult {
        require(d6 in 1..6)
        return DamageResult(max(1, d6 + strengthModifier), RuleTrace(EvidenceStatus.CANONICAL_RULE, listOf(SharedEvidence.damage(profile))))
    }

    fun naturalHealing(profile: RuleProfile, d3: Int, uninterruptedFullDayRest: Boolean): DamageResult {
        require(d3 in 1..3)
        val amount = if (uninterruptedFullDayRest) d3 else 0
        return DamageResult(amount, RuleTrace(EvidenceStatus.CANONICAL_RULE, listOf(SharedEvidence.damage(profile)), "1d3 HP only for a full uninterrupted day of rest"))
    }
}
