//菜单ts
export interface MenuItem {
    id: number | string;
    parentId: number | string;
    name: string;
    perms: string | null;
    type: number;
    url: string | null;
    icon: string | null;
    sort: number;
    parentName: string | null;
    list: MenuItem[] ;
}
