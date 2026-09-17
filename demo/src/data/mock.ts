import type { FileItem } from '@/types/file'

const now = Date.now()
const day = 24 * 60 * 60 * 1000

export const mockFiles: FileItem[] = [
  // 图片
  { id: '1', name: '装修灵感-客厅.jpg', path: '装修/装修灵感-客厅.jpg', category: 'image', size: 2.3 * 1024 * 1024, modifiedAt: now - 2 * day, thumbnail: 'https://picsum.photos/seed/living-room/400/300', annotation: '给设计师看的参考图，喜欢这个配色' },
  { id: '2', name: '全家福-2024春节.png', path: '照片/全家福-2024春节.png', category: 'image', size: 4.1 * 1024 * 1024, modifiedAt: now - 30 * day, thumbnail: 'https://picsum.photos/seed/family/400/300', annotation: '爷爷奶奶最喜欢这张' },
  { id: '3', name: '猫咪日常-睡觉.webp', path: '宠物/猫咪日常-睡觉.webp', category: 'image', size: 1.8 * 1024 * 1024, modifiedAt: now - 1 * day, thumbnail: 'https://picsum.photos/seed/cat/400/300', annotation: '' },
  { id: '4', name: '旅行-大理洱海.jpg', path: '旅行/大理洱海.jpg', category: 'image', size: 3.5 * 1024 * 1024, modifiedAt: now - 60 * day, thumbnail: 'https://picsum.photos/seed/erhai/400/300', annotation: '日落时分拍的，很美' },
  { id: '5', name: '截图-微信聊天记录.png', path: '截图/微信聊天记录.png', category: 'image', size: 520 * 1024, modifiedAt: now - 3 * day, thumbnail: 'https://picsum.photos/seed/chat/400/300', annotation: '重要信息已备份' },
  { id: '6', name: '设计稿-首页banner.fig.png', path: '工作/设计稿-首页banner.fig.png', category: 'image', size: 8.2 * 1024 * 1024, modifiedAt: now - 5 * day, thumbnail: 'https://picsum.photos/seed/banner/400/300', annotation: '已确认版本，可上线' },
  { id: '7', name: '证件照-蓝底.jpg', path: '证件/证件照-蓝底.jpg', category: 'image', size: 380 * 1024, modifiedAt: now - 120 * day, thumbnail: 'https://picsum.photos/seed/idphoto/400/300', annotation: '最新版，有效期至2026年' },
  { id: '8', name: '手绘草图-Logo设计.png', path: '设计/手绘草图-Logo设计.png', category: 'image', size: 1.2 * 1024 * 1024, modifiedAt: now - 10 * day, thumbnail: 'https://picsum.photos/seed/logo/400/300', annotation: '初稿，后续矢量化' },

  // 视频
  { id: '9', name: '宝宝第一次走路.mp4', path: '视频/宝宝第一次走路.mp4', category: 'video', size: 156 * 1024 * 1024, modifiedAt: now - 7 * day, thumbnail: 'https://picsum.photos/seed/baby/400/300', annotation: '发给爷爷奶奶看的' },
  { id: '10', name: '年会表演-完整版.mov', path: '视频/年会表演-完整版.mov', category: 'video', size: 2.1 * 1024 * 1024 * 1024, modifiedAt: now - 45 * day, thumbnail: 'https://picsum.photos/seed/annual/400/300', annotation: '公司年会节目，全员必看' },
  { id: '11', name: '做菜教程-红烧肉.mp4', path: '教程/做菜教程-红烧肉.mp4', category: 'video', size: 340 * 1024 * 1024, modifiedAt: now - 15 * day, thumbnail: 'https://picsum.photos/seed/cooking/400/300', annotation: '奶奶亲传秘方' },
  { id: '12', name: '旅行Vlog-云南行.webm', path: 'Vlog/云南行.webm', category: 'video', size: 890 * 1024 * 1024, modifiedAt: now - 90 * day, thumbnail: 'https://picsum.photos/seed/yunnan/400/300', annotation: '剪辑了一半，还差配乐' },

  // 文档
  { id: '13', name: '装修合同-最终版.pdf', path: '装修/装修合同-最终版.pdf', category: 'document', size: 1.2 * 1024 * 1024, modifiedAt: now - 3 * day, thumbnail: undefined, annotation: '已盖章生效，务必保存好' },
  { id: '14', name: '2024年终总结.docx', path: '工作/2024年终总结.docx', category: 'document', size: 890 * 1024, modifiedAt: now - 20 * day, thumbnail: undefined, annotation: '已提交领导审批' },
  { id: '15', name: '家庭月度账单.xlsx', path: '财务/家庭月度账单.xlsx', category: 'document', size: 156 * 1024, modifiedAt: now - 2 * day, thumbnail: undefined, annotation: '1月支出超预算，需复盘' },
  { id: '16', name: '产品需求文档-v2.3.md', path: '工作/产品需求文档-v2.3.md', category: 'document', size: 45 * 1024, modifiedAt: now - 1 * day, thumbnail: undefined, annotation: '新增了导出功能需求' },
  { id: '17', name: '阅读笔记-原子习惯.txt', path: '学习/阅读笔记-原子习惯.txt', category: 'document', size: 12 * 1024, modifiedAt: now - 40 * day, thumbnail: undefined, annotation: '核心：微习惯，复利效应' },
  { id: '18', name: '房屋租赁合同.pdf', path: '法律/房屋租赁合同.pdf', category: 'document', size: 2.1 * 1024 * 1024, modifiedAt: now - 200 * day, thumbnail: undefined, annotation: '电子版备份，纸质版在抽屉' },

  // 代码
  { id: '19', name: 'lan-share-main.go', path: '项目/lan-share/main.go', category: 'code', size: 8.5 * 1024, modifiedAt: now - 1 * day, thumbnail: undefined, annotation: '入口文件，路由注册在这' },
  { id: '20', name: 'file-scan.ts', path: '项目/lan-share/file-scan.ts', category: 'code', size: 12 * 1024, modifiedAt: now - 2 * day, thumbnail: undefined, annotation: '增量扫描逻辑，用fsnotify' },
  { id: '21', name: 'CategoryView.vue', path: '项目/lan-share-frontend/src/views/CategoryView.vue', category: 'code', size: 6.2 * 1024, modifiedAt: now - 3 * day, thumbnail: undefined, annotation: '主视图组件' },
  { id: '22', name: 'api-client.ts', path: '项目/lan-share-frontend/src/api/client.ts', category: 'code', size: 3.1 * 1024, modifiedAt: now - 5 * day, thumbnail: undefined, annotation: 'axios 封装，含拦截器' },
  { id: '23', name: 'docker-compose.yml', path: '项目/lan-share/docker-compose.yml', category: 'code', size: 1.2 * 1024, modifiedAt: now - 10 * day, thumbnail: undefined, annotation: '生产环境编排，含健康检查' },
  { id: '24', name: 'README.md', path: '项目/lan-share/README.md', category: 'code', size: 4.8 * 1024, modifiedAt: now - 7 * day, thumbnail: undefined, annotation: '项目文档，部署说明齐全' },

  // 压缩包
  { id: '25', name: '照片备份-2024全年.zip', path: '备份/照片备份-2024全年.zip', category: 'archive', size: 4.2 * 1024 * 1024 * 1024, modifiedAt: now - 5 * day, thumbnail: undefined, annotation: '全年原图备份，约1.2万张' },
  { id: '26', name: '项目源码-导出.rar', path: '备份/项目源码-导出.rar', category: 'archive', size: 520 * 1024 * 1024, modifiedAt: now - 30 * day, thumbnail: undefined, annotation: '不含node_modules，仅源码' },
  { id: '27', name: '数据库备份-202412.sql.gz', path: '备份/数据库备份-202412.sql.gz', category: 'archive', size: 85 * 1024 * 1024, modifiedAt: now - 1 * day, thumbnail: undefined, annotation: '每日自动备份，保留30天' },
  { id: '28', name: '设计素材包.7z', path: '设计/设计素材包.7z', category: 'archive', size: 1.8 * 1024 * 1024 * 1024, modifiedAt: now - 15 * day, thumbnail: undefined, annotation: '含字体、图标、模板' },

  // 其他
  { id: '29', name: '字体包-思源黑体.ttf', path: '字体/思源黑体.ttf', category: 'other', size: 12 * 1024 * 1024, modifiedAt: now - 60 * day, thumbnail: undefined, annotation: '商用免费，全字重' },
  { id: '30', name: '路由器固件.bin', path: '固件/路由器固件.bin', category: 'other', size: 16 * 1024 * 1024, modifiedAt: now - 100 * day, thumbnail: undefined, annotation: 'OpenWrt 23.05 稳定版' },
  { id: '31', name: '未知文件.xyz', path: '临时/未知文件.xyz', category: 'other', size: 1024, modifiedAt: now - 1 * day, thumbnail: undefined, annotation: '下载时后缀丢失，待确认' }
]

export function getFilesByCategory(category: FileItem['category']): FileItem[] {
  return mockFiles.filter(f => f.category === category)
}

export function getFileById(id: string): FileItem | undefined {
  return mockFiles.find(f => f.id === id)
}

export function updateAnnotation(id: string, annotation: string): boolean {
  const file = mockFiles.find(f => f.id === id)
  if (file) {
    file.annotation = annotation
    return true
  }
  return false
}