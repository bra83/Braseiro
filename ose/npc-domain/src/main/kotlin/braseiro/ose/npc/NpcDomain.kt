package braseiro.ose.npc

import braseiro.ose.model.*

object NpcDomain {
    fun createStable(id:String,name:String,locationRef:String,knownFacts:Set<String> = emptySet())=NpcSnapshot(id,name,locationRef,knownFacts)
    fun move(game:GameExtensions,npcId:String,newLocation:String):GameExtensions {
        val npc=game.npcs[npcId] ?: error("NPC_NOT_FOUND:$npcId")
        return game.copy(npcs=game.npcs+(npcId to npc.copy(locationRef=newLocation)),revision=game.revision+1).canonical()
    }
    fun remember(game:GameExtensions,npcId:String,summary:String):GameExtensions {
        val npc=game.npcs[npcId] ?: error("NPC_NOT_FOUND:$npcId")
        val updated=npc.copy(memorySummaries=(npc.memorySummaries+summary).takeLast(20))
        return game.copy(npcs=game.npcs+(npcId to updated),revision=game.revision+1).canonical()
    }
    fun projectPlausibleKnowledge(game:GameExtensions,npcId:String,requestedFactIds:Set<String>):Set<String> {
        val npc=game.npcs[npcId] ?: return emptySet()
        return requestedFactIds intersect npc.knownFactIds
    }
}
