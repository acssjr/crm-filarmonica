#!/usr/bin/env python3
"""
AI Code Review Script using Claude API
Analisa PRs e gera comentarios de review automaticamente
"""

import os
import json
import sys
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import dataclass, asdict

try:
    from anthropic import Anthropic
except ImportError:
    print("Erro: anthropic não instalado. Execute: pip install anthropic")
    sys.exit(1)


@dataclass
class ReviewComment:
    path: str
    line: int
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    category: str  # Security, Performance, Bug, Maintainability
    title: str
    body: str


class AICodeReviewer:
    def __init__(self):
        api_key = os.environ.get('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY não configurada")

        self.client = Anthropic(api_key=api_key)
        self.comments: List[ReviewComment] = []

    def read_file_safely(self, filepath: str) -> str:
        """Lê arquivo com tratamento de erros"""
        try:
            path = Path(filepath)
            if path.exists():
                return path.read_text(encoding='utf-8', errors='ignore')
        except Exception as e:
            print(f"Aviso: Não foi possível ler {filepath}: {e}")
        return ""

    def get_changed_files(self) -> List[str]:
        """Retorna lista de arquivos modificados"""
        content = self.read_file_safely('changed-files.txt')
        files = [f.strip() for f in content.split('\n') if f.strip()]
        # Filtra apenas arquivos de código
        code_extensions = {'.ts', '.tsx', '.js', '.jsx', '.py', '.sql'}
        return [f for f in files if Path(f).suffix in code_extensions]

    def get_diff(self) -> str:
        """Retorna o diff do PR"""
        return self.read_file_safely('pr-diff.txt')

    def get_typecheck_errors(self) -> str:
        """Retorna erros do TypeScript"""
        return self.read_file_safely('typecheck-output.txt')

    def get_eslint_results(self) -> Dict[str, Any]:
        """Retorna resultados do ESLint"""
        content = self.read_file_safely('eslint-output.json')
        if content:
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                pass
        return {}

    def analyze_with_claude(self, diff: str, changed_files: List[str],
                           typecheck_errors: str, eslint_results: Dict) -> Dict[str, Any]:
        """Envia código para análise do Claude"""

        # Limita o tamanho do diff para não exceder limites
        max_diff_size = 50000
        if len(diff) > max_diff_size:
            diff = diff[:max_diff_size] + "\n... (diff truncado)"

        prompt = f"""Você é um especialista em code review para um projeto CRM em TypeScript/Node.js.

## Contexto do Projeto
- Backend: Fastify + TypeScript + Drizzle ORM
- Frontend: React 19 + Vite + TailwindCSS
- Database: PostgreSQL (Supabase)
- Queue: Redis + BullMQ

## Arquivos Modificados
{chr(10).join(f'- {f}' for f in changed_files[:20])}

## Diff do PR
```diff
{diff}
```

## Erros TypeScript
```
{typecheck_errors[:5000] if typecheck_errors else 'Nenhum erro'}
```

## Resultados ESLint
{json.dumps(eslint_results, indent=2)[:3000] if eslint_results else 'Nenhum resultado'}

## Instruções
Analise o código focando em:

1. **Segurança**: SQL injection, XSS, autenticação, validação de entrada
2. **Performance**: N+1 queries, loops ineficientes, falta de paginação
3. **Bugs**: Erros lógicos, edge cases não tratados, null/undefined
4. **Manutenibilidade**: Código duplicado, funções muito longas, nomes confusos
5. **TypeScript**: Tipos any desnecessários, validação em runtime

Para cada problema encontrado, retorne um JSON com este formato:
```json
{{
  "summary": "Resumo geral do review em markdown (pt-BR)",
  "critical_count": 0,
  "high_count": 0,
  "medium_count": 0,
  "issues": [
    {{
      "path": "caminho/do/arquivo.ts",
      "line": 42,
      "severity": "HIGH",
      "category": "Security",
      "title": "Título curto do problema",
      "description": "Descrição detalhada com sugestão de correção"
    }}
  ]
}}
```

IMPORTANTE:
- Responda APENAS com o JSON, sem texto adicional
- Use português brasileiro
- Seja específico sobre linhas e arquivos
- Inclua exemplos de código corrigido quando possível
- Se não houver problemas significativos, retorne issues vazio"""

        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8000,
                temperature=0.2,
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.content[0].text

            # Extrai JSON da resposta
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0]
            elif '```' in content:
                content = content.split('```')[1].split('```')[0]

            return json.loads(content.strip())

        except json.JSONDecodeError as e:
            print(f"Erro ao parsear resposta do Claude: {e}")
            print(f"Resposta: {content[:500]}...")
            return {
                "summary": "Erro ao processar review automático",
                "critical_count": 0,
                "high_count": 0,
                "medium_count": 0,
                "issues": []
            }
        except Exception as e:
            print(f"Erro na API do Claude: {e}")
            return {
                "summary": f"Erro na análise: {str(e)}",
                "critical_count": 0,
                "high_count": 0,
                "medium_count": 0,
                "issues": []
            }

    def format_summary(self, result: Dict[str, Any]) -> str:
        """Formata o resumo do review para comentário no PR"""
        issues = result.get('issues', [])
        critical = result.get('critical_count', 0)
        high = result.get('high_count', 0)
        medium = result.get('medium_count', 0)

        # Emoji baseado na severidade
        if critical > 0:
            status_emoji = "🔴"
            status_text = "Problemas críticos encontrados"
        elif high > 0:
            status_emoji = "🟠"
            status_text = "Problemas importantes encontrados"
        elif medium > 0:
            status_emoji = "🟡"
            status_text = "Sugestões de melhoria"
        else:
            status_emoji = "🟢"
            status_text = "Código aprovado"

        summary = f"""## {status_emoji} AI Code Review

{result.get('summary', 'Review concluído.')}

### Resumo
| Severidade | Quantidade |
|------------|------------|
| 🔴 Crítico | {critical} |
| 🟠 Alto | {high} |
| 🟡 Médio | {medium} |
| 🔵 Baixo | {len([i for i in issues if i.get('severity') == 'LOW'])} |

"""

        if issues:
            summary += "### Problemas Encontrados\n\n"
            for issue in issues[:10]:  # Limita a 10 issues no resumo
                severity_emoji = {
                    'CRITICAL': '🔴',
                    'HIGH': '🟠',
                    'MEDIUM': '🟡',
                    'LOW': '🔵',
                    'INFO': 'ℹ️'
                }.get(issue.get('severity', 'INFO'), 'ℹ️')

                summary += f"- {severity_emoji} **{issue.get('title', 'Issue')}** "
                summary += f"(`{issue.get('path', '')}:{issue.get('line', '')}`)\n"

        summary += "\n---\n*Review automático gerado por Claude AI*"

        return summary

    def format_inline_comments(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Formata comentários inline para o PR"""
        comments = []
        for issue in result.get('issues', []):
            severity_emoji = {
                'CRITICAL': '🔴 CRÍTICO',
                'HIGH': '🟠 IMPORTANTE',
                'MEDIUM': '🟡 SUGESTÃO',
                'LOW': '🔵 MENOR',
                'INFO': 'ℹ️ INFO'
            }.get(issue.get('severity', 'INFO'), 'ℹ️')

            body = f"""**{severity_emoji}**: {issue.get('title', '')}

{issue.get('description', '')}

*Categoria: {issue.get('category', 'Geral')}*"""

            comments.append({
                'path': issue.get('path', ''),
                'line': issue.get('line', 1),
                'body': body
            })

        return comments

    def run(self):
        """Executa o review completo"""
        print("🔍 Iniciando AI Code Review...")

        # Coleta informações
        changed_files = self.get_changed_files()
        if not changed_files:
            print("Nenhum arquivo de código modificado")
            result = {
                "summary": "## 🟢 AI Code Review\n\nNenhum arquivo de código modificado neste PR.",
                "comments": [],
                "critical_count": 0
            }
            Path('review-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
            return

        print(f"📁 Arquivos modificados: {len(changed_files)}")

        diff = self.get_diff()
        typecheck_errors = self.get_typecheck_errors()
        eslint_results = self.get_eslint_results()

        # Analisa com Claude
        print("🤖 Analisando com Claude...")
        analysis = self.analyze_with_claude(diff, changed_files, typecheck_errors, eslint_results)

        # Formata resultado
        result = {
            "summary": self.format_summary(analysis),
            "comments": self.format_inline_comments(analysis),
            "critical_count": analysis.get('critical_count', 0),
            "high_count": analysis.get('high_count', 0),
            "issues": analysis.get('issues', [])
        }

        # Salva resultado
        Path('review-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
        print(f"✅ Review concluído: {len(result['comments'])} comentários gerados")

        # Mostra resumo no console
        print("\n" + "="*50)
        print(f"Críticos: {result['critical_count']}")
        print(f"Altos: {result['high_count']}")
        print(f"Total issues: {len(analysis.get('issues', []))}")


if __name__ == '__main__':
    reviewer = AICodeReviewer()
    reviewer.run()
