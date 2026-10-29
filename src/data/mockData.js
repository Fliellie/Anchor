export const initialTheories = [
  {
    id: 'theory-1',
    title: 'name of theory',
    items: [
      {
        id: 'item-1',
        title: 'tên mục 1',
        type: 'code', // 'code' | 'markdown' | 'image'
        quickContent: '// Code mẫu quick using\nconsole.log("Hello Anchor");',
        description: 'Nội dung mô tả chi tiết của mục 1...',
        tags: ['react', 'javascript', 'frontend']
      },
      {
        id: 'item-2',
        title: 'tên mục 2',
        type: 'markdown',
        quickContent: 'Ghi chú nhanh dạng markdown',
        description: 'Mô tả chi tiết bài học...',
        tags: ['notes', 'study']
      }
    ]
  }
];