# Protecao de main e master

Uma pipeline executa depois que o GitHub recebe a alteracao. Quem impede
push direto no servidor e o ruleset do repositorio. O arquivo JSON nesta
pasta e uma configuracao para importar, nao e ativado automaticamente pelo Git.

## Ativacao pelo dono do repositorio

1. Envie estes arquivos em uma branch de trabalho e abra um pull request para
   `main`. Aguarde o job `validar-diff` passar e faca o merge inicial.
2. Abra https://github.com/vinni-lacerda/AV3-analise-dados-big-data/settings/rules.
3. Em **New ruleset > Import a ruleset**, selecione
   `.github/rulesets/protect-primary.json`.
4. Confira **Enforcement status: Active**, as branches `main` e `master`,
   a lista de bypass vazia e o check obrigatorio `validar-diff`. Salve a regra.
5. Verifique a regra salva e abra outro PR para confirmar que o check obrigatorio
   aparece e que o merge fica condicionado ao resultado.

O ruleset exige pull request e check aprovado com a branch atualizada,
bloqueia force push e exclusao das branches protegidas. Sem bypass, a regra
tambem se aplica ao dono. Quem administra as regras ainda pode altera-las.
Nao exige aprovacao de outro integrante para permitir trabalho individual.
Para exigir revisao por um colega, altere `required_approving_review_count`
para `1` antes de importar ou edite a regra no GitHub.

O job verifica erros de whitespace e novos marcadores de conflito com
`git diff --check`. Nao substitui testes do projeto, que ainda nao possui codigo.
Ele executa em todos os PRs destinados a `main` ou `master`, sem filtro de caminhos.

## Fluxo diario

```powershell
git switch main
git pull --ff-only
git switch -c feat/minha-alteracao
# Edite os arquivos e selecione os que deseja incluir.
git add caminho/do/arquivo
git commit -m "Descreve a alteracao"
git push -u origin feat/minha-alteracao
```

Depois, abra um PR para `main`. Commits locais na `main` continuam possiveis;
o GitHub rejeita o push direto quando o ruleset estiver ativo.

Rulesets estao disponiveis em repositorios publicos nos planos gratuitos;
repositorios privados dependem do plano contratado.

Referencias:
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository
- https://docs.github.com/en/rest/repos/rules
