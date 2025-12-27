# Frontend Redesign - Untitled UI Style

## Overview

Complete frontend redesign based on Untitled UI design system. Moving from burgundy/gold theme to clean black/white neutral palette.

## Design Decisions

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Sizes**: 12px (labels), 14px (body), 16px (large), 24px (h2), 30px (h1)

### Color Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `gray-25` | #FCFCFD | - | Subtle backgrounds |
| `gray-50` | #F9FAFB | - | Secondary backgrounds |
| `gray-100` | #F2F4F7 | - | Borders light |
| `gray-200` | #E4E7EC | - | Borders |
| `gray-300` | #D0D5DD | - | Borders dark |
| `gray-400` | #98A2B3 | - | Placeholder text |
| `gray-500` | #667085 | - | Tertiary text |
| `gray-600` | #475467 | - | Secondary text |
| `gray-700` | #344054 | - | Primary text light |
| `gray-800` | #1D2939 | - | Dark backgrounds |
| `gray-900` | #101828 | - | Primary text |
| `gray-950` | #0C111D | - | Darkest background |
| `primary-500` | #7F56D9 | - | Primary actions |
| `primary-600` | #6941C6 | - | Primary hover |
| `success-500` | #12B76A | - | Success, online |
| `error-500` | #D92D20 | - | Error, danger |
| `warning-500` | #F79009 | - | Warning |

### Icons
- **Library**: Lucide React
- **Style**: Outline
- **Stroke**: 1.5px
- **Size**: 20px (nav), 16px (buttons), 24px (headers)

## Sidebar Structure

```
PRINCIPAL
├── Dashboard (LayoutDashboard)
├── Conversas (MessageSquare) [badge]
├── Contatos (Users)
└── Interessados (UserCheck) [badge]

MARKETING
├── Campanhas (Megaphone)
└── Templates (FileText)

ANÁLISE
├── Relatórios (BarChart3)
└── Funil (Filter)

GERENCIAR
├── Automações (Workflow)
├── Tags (Tag)
└── Equipe (UserCog)

FOOTER
├── Configurações (Settings)
└── User Profile Card
```

### Sidebar Specs
- Width: 280px fixed
- Active item: `gray-50` background, `gray-900` text
- Hover: `gray-50` background
- Section labels: 12px, uppercase, `gray-500`, letter-spacing 0.5px
- Padding: 16px horizontal, 8px vertical per item

## Page Layout

```
┌──────────────────────────────────────────────────────┐
│ Page Title                    [Secondary] [Primary]  │
├──────────────────────────────────────────────────────┤
│ Tab 1   Tab 2   Tab 3   Tab 4                        │
├──────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                  │
│ │ Stat 1  │ │ Stat 2  │ │ Stat 3  │                  │
│ └─────────┘ └─────────┘ └─────────┘                  │
├──────────────────────────────────────────────────────┤
│ [Filter] [Filter] [+ More]            [Search]       │
├──────────────────────────────────────────────────────┤
│ Table Header                                         │
│ Table Row 1                                          │
│ Table Row 2                                          │
│ ...                                                  │
├──────────────────────────────────────────────────────┤
│ Pagination                                           │
└──────────────────────────────────────────────────────┘
```

## Components

### Buttons
- Primary: `primary-500` bg, white text, hover `primary-600`
- Secondary: white bg, `gray-300` border, `gray-700` text
- Ghost: transparent, `gray-500` text
- Danger: `error-500` bg, white text
- Border-radius: 8px
- Height: 40px (default), 36px (sm), 44px (lg)

### Inputs
- Border: `gray-300`
- Border-radius: 8px
- Focus: `primary-500` border + ring
- Height: 40px (default), 44px (lg)
- Placeholder: `gray-400`

### Cards
- Background: white / `gray-800` dark
- Border: `gray-200` / `gray-700` dark
- Border-radius: 12px
- Shadow: `0 1px 2px rgba(16,24,40,0.05)`

### Badges
- Border-radius: 16px (pill)
- Padding: 2px 8px
- Font: 12px medium

### Table
- Header: `gray-50` bg, `gray-500` text, 12px uppercase
- Row hover: `gray-50`
- Divider: 1px `gray-200`

### User Profile Card
- Avatar: 32px, rounded full
- Online dot: 8px, `success-500`
- Dropdown: 12px radius, shadow lg

## Dark Mode

Toggle in user dropdown. Uses CSS variables for seamless switching.
- Background: `gray-950`
- Cards: `gray-800`
- Borders: `gray-700`
- Text: `gray-100` primary, `gray-400` secondary

## Implementation Order

1. Update Tailwind config with new color palette
2. Install Inter font
3. Install and configure Lucide React
4. Rebuild Layout component (sidebar)
5. Create new base components (Button, Input, Card, Badge, Table)
6. Update existing pages (Dashboard, Contacts, Conversations, Prospects)
7. Create placeholder pages for new features
