import type { SxProps, Theme } from "@mui/material"

// Junta o estilo de um componente ao `sx` que quem o usa passou por cima.
// O MUI aceita no `sx` um estilo só ou uma lista deles, e a lista é que deixa
// um ajustar o outro: o próprio vem primeiro, e o de fora o sobrescreve.
export const withSx = (own: SxProps<Theme>, sx?: SxProps<Theme>): SxProps<Theme> => [
    ...(Array.isArray(own) ? own : [own]),
    ...(Array.isArray(sx) ? sx : [sx]),
]
