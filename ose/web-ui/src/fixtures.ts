export type FixtureId = 'session-prestart' | 'character-sheet' | 'keyboard-open';

export interface PresentationFixture {
  id: FixtureId;
  title: string;
  subtitle: string;
  narrative?: string;
  party?: string[];
  character?: {
    name: string; classLabel: string; level: number; hp: string; ac: string; movement: string; xp: string;
    attributes: Array<[string, number, string]>; saves: Array<[string, number]>; inventory: string[];
  };
}

export const FIXTURE_REVISION = 'WAVE2_CAPTURE_FIXTURE_V1';
export const FIXED_CLOCK = '2026-09-01T12:00:00Z';

export const fixtures: Record<FixtureId, PresentationFixture> = {
  'session-prestart': {
    id: 'session-prestart', title: 'Sessão', subtitle: 'Prontos para entrar no mundo',
    party: ['Aldren — Guerreiro', 'Mira — Clériga', 'Tovin — Ladrão'],
    narrative: 'A campanha está carregada. A posição inicial está definida. A narração ainda não começou.'
  },
  'character-sheet': {
    id: 'character-sheet', title: 'Ficha de Personagem', subtitle: 'Estado demonstrativo de apresentação',
    character: {
      name: 'Aldren', classLabel: 'Guerreiro', level: 2, hp: '11 / 14', ac: '4 [15]', movement: '90’ (30’)', xp: '2.150',
      attributes: [['FOR',16,'+2'],['INT',9,'0'],['SAB',11,'0'],['DES',13,'+1'],['CON',14,'+1'],['CAR',8,'−1']],
      saves: [['Morte/Veneno',12],['Varinhas',13],['Paralisia/Pedra',14],['Sopro',15],['Magias',16]],
      inventory: ['Espada', 'Escudo', 'Cota de malha', 'Tochas × 6', 'Rações × 7', 'Corda 50’', 'Odre', '32 po']
    }
  },
  'keyboard-open': {
    id: 'keyboard-open', title: 'Sessão', subtitle: 'Entrada ativa com teclado',
    narrative: 'O corredor de pedra continua além da luz da tocha. O campo de ação permanece utilizável mesmo com a área de teclado aberta.'
  }
};
