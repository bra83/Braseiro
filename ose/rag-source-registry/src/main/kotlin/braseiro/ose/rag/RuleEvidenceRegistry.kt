package braseiro.ose.rag

import braseiro.ose.model.RuleProfile
import braseiro.ose.rules.api.*

data class EvidenceQueryResult(val trace: RuleTrace, val text: String)

class RuleEvidenceRegistry {
    private val entries = listOf(
        RuleEvidence("CLASSIC_CHARACTER_CREATION",RuleProfile.OSE_CLASSIC_FANTASY,"Old-School Essentials Classic Fantasy — Tomo de Regras","pp.14-15"),
        RuleEvidence("ADVANCED_BASIC_CHARACTER_CREATION",RuleProfile.OSE_ADVANCED_FANTASY,"Advanced Fantasy Player's Tome","pp.14,16-17"),
        RuleEvidence("ADVANCED_METHOD_CHARACTER_CREATION",RuleProfile.OSE_ADVANCED_FANTASY,"Advanced Fantasy Player's Tome","pp.14,18-19"),
        RuleEvidence("RESOLVE.D20.ROLL_HIGH_ATTACK",RuleProfile.OSE_CLASSIC_FANTASY,"Classic Rules Tome","GAME_SYSTEM_SPEC §§11,23-24"),
        RuleEvidence("RESOLVE.D20.ROLL_HIGH_ATTACK",RuleProfile.OSE_ADVANCED_FANTASY,"Advanced corpus","GAME_SYSTEM_SPEC §§11,23-24"),
        RuleEvidence("TIME.TURN",RuleProfile.OSE_CLASSIC_FANTASY,"Classic Rules Tome","GAME_SYSTEM_SPEC §12"),
        RuleEvidence("TIME.TURN",RuleProfile.OSE_ADVANCED_FANTASY,"Advanced corpus","GAME_SYSTEM_SPEC §12")
    )
    fun lookup(profile: RuleProfile, ruleId: String): EvidenceQueryResult {
        val found=entries.filter{it.profile==profile && it.ruleId==ruleId}
        return if(found.isEmpty()) EvidenceQueryResult(RuleTrace(EvidenceStatus.MISSING_EVIDENCE,emptyList(),"No canonical evidence registered; no fallback allowed"),"MISSING_EVIDENCE")
        else EvidenceQueryResult(RuleTrace(EvidenceStatus.CANONICAL_RULE,found),found.joinToString("; "){"${it.source} ${it.location}"})
    }
}
