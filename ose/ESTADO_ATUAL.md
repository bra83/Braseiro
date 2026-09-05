PROJETO / EDIÇÃO / ESCOPO: BRASEIRO OSE — Old-School Essentials; fechar funcionamento e visual já aprovado sem misturar outros sistemas.
ATUALIZADO_EM: 2026-09-05
BASELINE: bra83/Braseiro branch ose-s23ultra-webview-capture; visual commit b55686b456299317b760be024c0b7449b7fc2c8f.
TRABALHO_ATUAL: commits 9d4734db70aa81281ed56e642525b01be7322801 e 033436ef96ec717dbb8dba8be09fea5b7b407026 adicionam proteção contra overlays/ANR do launcher no teste e workflow de captura Android WebView.
CAPACIDADES: leitura=SIM; edição=SIM; testes=SIM via GitHub Actions; navegador=sem prova standalone nesta rodada; Android=SIM em emulador API 35 com WebView e geometria 1440x3088/540 dpi; salvamento=SIM no repositório/branch.
TESTADO: run 24 / 33943724287 — connectedDebugAndroidTest e captura Android WebView concluíram com sucesso técnico; porém as 4 imagens foram visualmente invalidadas por popup sistêmico “Pixel Launcher isn't responding”.
IMPLEMENTADO_NÃO_TESTADO: guarda de foreground do app antes de cada screencap; hide_error_dialogs/show_first_crash_dialog/show_restart_in_crash_dialog; fechamento de system dialogs; PROVENANCE com SYSTEM_OVERLAY_GUARD=ENABLED. Run 26 / 33944231929 em execução.
FALTA: validar run 26 sem overlay; comparar Sessão/Mapa/Ficha com concepts 415x915; Companhia sem concept canônico comprovado; DEVICE_PASS físico não executado.
DECISÕES_E_RESTRIÇÕES: 415x915 é autoridade visual; screenshots não substituem UI; PLAYER_ACTION e GM_HELP separados; posição canônica única; não inventar visual de Companhia sem referência aprovada.
BLOQUEIO_REAL: nenhum para motor/código; Companhia visual depende de referência aprovada; aparelho físico depende de acesso externo.
PRÓXIMA_AÇÃO: baixar artefato do run 26, rejeitar se houver overlay, inspecionar s23ultra_webview_01_session.png contra PUBLIC_PIN_CONCEPT_SESSION_ACTIVE_415x915.png e aplicar a próxima correção geométrica comprovada.
RECUPERAÇÃO: retomar branch ose-s23ultra-webview-capture no commit 033436ef96ec717dbb8dba8be09fea5b7b407026; baseline visual anterior preservada em b55686b456299317b760be024c0b7449b7fc2c8f.
