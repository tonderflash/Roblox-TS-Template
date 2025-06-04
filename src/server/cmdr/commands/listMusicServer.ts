import { CommandContext } from "@rbxts/cmdr";

export = function (context: CommandContext) {
    try {
        return `🎵 MÚSICA POPULAR DISPONIBLE:

🔥 MÚSICA ELECTRÓNICA:
- Alan Walker - Faded: 376747603
- Skrillex - Bangarang: 142858149
- TheFatRat - Monody: 277287251
- OMFG - Hello: 290718321

🎤 MÚSICA POP:
- Dua Lipa - Levitating: 5410084999
- The Weeknd - Blinding Lights: 4636142103
- Imagine Dragons - Believer: 1072923859
- Ed Sheeran - Shape of You: 531981987

🌮 MÚSICA LATINA:
- Bad Bunny - Tití Me Preguntó: 8636070458
- Rosalía - La Fama: 8025554275
- J Balvin - Machika: 1443379447

🎮 MÚSICA DE VIDEOJUEGOS:
- Minecraft - Sweden: 1837879082
- Undertale - Megalovania: 337067190
- Zelda - Song of Storms: 131961821

💡 USO: /changeMusic <soundId> [nombre]
📝 Ejemplo: /changeMusic 376747603 "Faded"`;
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
