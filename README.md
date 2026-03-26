# AVATAR-3D

Apresentador virtual 3D interativo para TCC — Tecnologia e Inovação na Saúde Pública.

Avatar 3D com lip sync, animações de gestos e expressões, narração por síntese de voz em português brasileiro.

## Tecnologias

- React 18 + Three.js + React Three Fiber
- Animações FBX (Mixamo)
- Web Speech API (TTS pt-BR)
- Zustand (estado) + Framer Motion (UI)
- Vite

## Instalação

### Pré-requisitos

- [Node.js](https://nodejs.org/) versão 18 ou superior

### Windows (rápido)

1. Clique duas vezes em `instalar.bat`
2. Clique duas vezes em `iniciar.bat`
3. Acesse http://localhost:3000

### Terminal

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

### Build de Produção

```bash
npm run build
npm run preview
```

## Estrutura

```
src/
  components/   → Avatar 3D, cena, controles, painel de slides
  data/         → conteúdo dos slides do TCC
  hooks/        → síntese de voz com visemas
  engine/       → biblioteca de emotes
public/
  models/       → modelo 3D (GLB)
  animations/   → animações FBX
```

## Autores

- Lucas Pascoal Antunes — N093AB4
- Christian Santos de Oliveira — F352870

Turma CC7P41 — Ciências da Computação
Universidade Paulista — UNIP, 2026
