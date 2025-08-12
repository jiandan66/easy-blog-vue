// 标签类型定义
export interface TagItem {
    tagId: string;
    tagName: string;
    tagType: string;
}

// 博客文章类型定义
export interface ArticleItem {
    articleId: string;
    title: string;
    content: string;
    frontCover?: string | null;
    tagList?: TagItem[];
    createTime?: string;
    updateTime?: string;
    status?: string;
}
