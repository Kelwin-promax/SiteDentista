# Kelwin Odontologia — site institucional

Site estático completo (HTML + CSS + JavaScript puro, sem build e sem dependências).

## Estrutura

```
index.html                 página única com todas as seções
assets/css/style.css       estilos (design system em variáveis CSS no :root)
assets/js/main.js          agendamento, planos, carrossel, formulários
assets/img/                as 7 fotos originais, renomeadas por uso
.claude/launch.json        config do servidor local de preview
```

## Como abrir

Basta dar duplo clique em `index.html`. Para servir em `http://localhost:5599`:

```bash
python -m http.server 5599
```

## Seções

Topo com telefone · menu fixo · hero · faixa de especialidades · 6 tratamentos ·
números da clínica · sobre a clínica · **equipe** · **planos de assinatura** (mensal/anual) ·
protocolo do sorriso em 3 etapas · depoimentos · **agendamento online em 4 passos** ·
FAQ · contato + mapa · rodapé · botão flutuante de WhatsApp.

## Agendamento

Fluxo: tratamento e profissional → calendário e horário → dados → confirmação.

- Calendário até 4 meses à frente; domingos e datas passadas bloqueados.
- Grade de horários diferente aos sábados; horários já passados no dia de hoje ficam indisponíveis.
- Horários ocupados são gerados de forma determinística por data (o mesmo dia mostra sempre a mesma agenda) e somados aos agendamentos já feitos.
- Os agendamentos ficam em `localStorage` (chave `kelwin_odonto_agendamentos`) e aparecem na coluna lateral, com opção de cancelar.
- Ao confirmar: protocolo, link do WhatsApp já preenchido e download do convite `.ics` para a agenda.

> Isso é um protótipo de front-end. Para valer em produção, o `submit` em
> `assets/js/main.js` precisa enviar os dados para um backend/CRM em vez de gravar no navegador.

## O que trocar antes de publicar

| Onde | O quê |
|---|---|
| `index.html` | telefone `(11) 4002-8922`, número do WhatsApp `5511940028922`, endereço, CNPJ, CRO, e-mail, links sociais |
| `index.html` (seção `#planos`) | nomes, valores (`data-mensal` / `data-anual`) e itens dos planos |
| `index.html` (seção `#servicos`) | tratamentos e faixas de preço |
| `index.html` (seção `#equipe`) | nomes, CROs, especialidades e dias de atendimento |
| `assets/js/main.js` | `baseSlots()` para os horários reais e `isClosed()` para os dias sem atendimento |
| `assets/css/style.css` | paleta e tipografia nas variáveis do `:root` |
| seção `.map` | trocar o mapa decorativo por um `<iframe>` do Google Maps, se quiser |

Textos de depoimentos, estatísticas e nomes de profissionais são fictícios — revise tudo
antes de publicar. Lembre também das regras do Conselho Federal de Odontologia para
publicidade: nada de promessa de resultado, e o nome e CRO do responsável técnico
precisam estar visíveis (já estão no rodapé).
