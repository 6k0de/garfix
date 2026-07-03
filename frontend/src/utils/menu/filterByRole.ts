import type { MenuItem, Role } from "@/@types"


export const filterByRole = (items: MenuItem[], userRoles: Role[]): MenuItem[] =>
    items
        .map((item) => {
            const canSee = !item.roles || item.roles.some((r) => userRoles.includes(r))
            const submenu = item.submenu ? filterByRole(item.submenu, userRoles) : undefined

            // Si el padre no es visible pero tiene hijos visibles, lo dejamos como contenedor
            if (!canSee && (!submenu || submenu.length === 0)) return null

            return { ...item, ...(submenu ? { submenu } : {}) }
        })
        .filter(Boolean) as MenuItem[]
