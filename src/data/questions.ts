/**
 * 阶段 1 题库数据
 * 主题：嵌入式 / 电路基础（贴合 sora 的专业方向）
 * 阶段 1 用静态数据，阶段 2 会换成服务端下发
 */

export interface Question {
  id: string
  stem: string
  options: string[]
  answer: number
  explain: string
  tag: string
}

export const QUESTION_BANK: Question[] = [
  {
    id: 'q001',
    stem: '在 8051 单片机中，复位后程序计数器 PC 的初始值是多少？',
    options: ['0000H', '0003H', '000BH', '0013H'],
    answer: 0,
    explain: '8051 复位后 PC = 0000H，从程序存储器首地址开始执行。0003H 是外部中断 0 的入口地址。',
    tag: '单片机'
  },
  {
    id: 'q002',
    stem: 'STM32 中 GPIO 输出模式配置为「开漏输出」时，要驱动 LED 通常需要什么？',
    options: ['直接接 LED 到地', '外接上拉电阻', '外接下拉电阻', '不需要任何外围元件'],
    answer: 1,
    explain: '开漏输出只能拉低，无法主动输出高电平，因此需要外接上拉电阻才能输出高电平。',
    tag: '单片机'
  },
  {
    id: 'q003',
    stem: '两个 10kΩ 电阻并联后的等效阻值是多少？',
    options: ['20kΩ', '10kΩ', '5kΩ', '2.5kΩ'],
    answer: 2,
    explain: '并联公式 1/R = 1/R1 + 1/R2，两个相同阻值并联等于一半，即 5kΩ。',
    tag: '电路基础'
  },
  {
    id: 'q004',
    stem: 'KiCad 中用于表示 PCB 板边框的图层通常是哪一层？',
    options: ['F.Cu', 'Edge.Cuts', 'F.SilkS', 'F.Mask'],
    answer: 1,
    explain: 'Edge.Cuts 是板框层，用来定义 PCB 的物理外形边界，导出 Gerber 时必需。',
    tag: 'PCB'
  },
  {
    id: 'q005',
    stem: 'I2C 总线的 SDA 和 SCL 两根线上通常需要接什么元件？',
    options: ['下拉电阻', '串联电阻', '上拉电阻', '不需要任何电阻'],
    answer: 2,
    explain: 'I2C 是开漏结构，SDA/SCL 都需要上拉电阻（常见 4.7kΩ）才能产生高电平。',
    tag: '电路基础'
  },
  {
    id: 'q006',
    stem: 'UART 通信中，波特率 9600 表示什么含义？',
    options: ['每秒传输 9600 字节', '每秒传输 9600 个二进制位', '时钟频率 9600Hz', '每秒传输 9600 个数据帧'],
    answer: 1,
    explain: '波特率表示每秒传输的码元数，UART 中一个码元对应一个二进制位，所以是 9600 bit/s。',
    tag: '通信'
  },
  {
    id: 'q007',
    stem: '在电源电路中，104 电容的容值是多少？',
    options: ['104pF', '10.4nF', '100nF', '104uF'],
    answer: 2,
    explain: '三位数码标注法：前两位是有效数字，第三位是 10 的幂（单位 pF）。104 = 10 × 10⁴ pF = 100nF。',
    tag: '电路基础'
  },
  {
    id: 'q008',
    stem: 'ADC 的分辨率为 12 位、参考电压 3.3V 时，最小可分辨电压约为多少？',
    options: ['约 0.8mV', '约 1.6mV', '约 3.3mV', '约 8mV'],
    answer: 0,
    explain: '3.3V / 4096 ≈ 0.806mV。这是 12 位 ADC 的理论最小分辨电压（1 LSB）。',
    tag: '电路基础'
  },
  {
    id: 'q009',
    stem: 'FreeRTOS 中，任务处于「阻塞态」的常见原因是什么？',
    options: ['任务优先级过低', '任务调用了 vTaskDelay 或等待信号量', '任务被删除', '任务栈溢出'],
    answer: 1,
    explain: '阻塞态指任务在等待某个事件（延时、信号量、队列、事件组）而主动让出 CPU。',
    tag: 'RTOS'
  },
  {
    id: 'q010',
    stem: '关于 PCB 铺铜（Copper Pour），下列说法正确的是？',
    options: ['铺铜一定会增加电磁干扰', '铺铜可用于降低地阻抗和散热', '铺铜只用于美观', '高频板不应铺铜'],
    answer: 1,
    explain: '铺铜能降低地平面阻抗、帮助散热、减少 EMI，是常规 PCB 设计的标准做法。',
    tag: 'PCB'
  },
  {
    id: 'q011',
    stem: '三极管的「放大区」工作条件是？',
    options: ['发射结正偏、集电结正偏', '发射结正偏、集电结反偏', '发射结反偏、集电结正偏', '两结均反偏'],
    answer: 1,
    explain: 'NPN 三极管工作在放大区时，发射结正偏、集电结反偏，此时具有电流放大能力。',
    tag: '电路基础'
  },
  {
    id: 'q012',
    stem: 'SPI 通信相比 I2C，最显著的特点是？',
    options: ['引脚更少', '支持多主多从自动仲裁', '全双工、速率更高', '不需要片选信号'],
    answer: 2,
    explain: 'SPI 是全双工同步串行总线，速率可达几十 MHz；代价是每个从机需要独立片选线，引脚占用多。',
    tag: '通信'
  },
  {
    id: 'q013',
    stem: '在 KiCad 中完成原理图后，生成 PCB 前必须执行的操作是？',
    options: ['导出 BOM', '更新 PCB 并导入网表', '生成 3D 模型', '运行 DRC'],
    answer: 1,
    explain: '必须先「更新 PCB / 导入网表」，把原理图的元件与网络连接同步到 PCB 编辑器中。',
    tag: 'PCB'
  },
  {
    id: 'q014',
    stem: '锂电池标称电压 3.7V，满电电压通常约为多少？',
    options: ['3.7V', '4.2V', '4.8V', '5.0V'],
    answer: 1,
    explain: '锂离子电池标称 3.7V，满电截止电压一般为 4.2V，放电截止约 3.0V。',
    tag: '电路基础'
  },
  {
    id: 'q015',
    stem: '关于上拉电阻的取值，下列说法正确的是？',
    options: ['阻值越小越省电', '阻值越小上升沿越陡但功耗越大', '阻值越大上升沿越陡', '阻值对功耗没有影响'],
    answer: 1,
    explain: '上拉电阻小 → RC 时间常数小 → 上升沿快，但静态电流大；需要在速度与功耗间权衡。',
    tag: '电路基础'
  },
  {
    id: 'q016',
    stem: '中断服务函数（ISR）中应该尽量避免的操作是？',
    options: ['设置标志位', '读取寄存器', '调用耗时的延时函数', '清除中断标志'],
    answer: 2,
    explain: 'ISR 应尽量短小，避免延时、浮点运算、动态内存分配等耗时操作，否则会阻塞其他中断。',
    tag: '单片机'
  }
]

/**
 * 随机抽取 N 道题
 */
export function pickQuestions(count: number, tag?: string): Question[] {
  let pool = QUESTION_BANK
  if (tag && tag !== '全部') {
    pool = pool.filter((q) => q.tag === tag)
  }
  if (pool.length === 0) pool = QUESTION_BANK

  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

/** 全部标签 */
export function getAllTags(): string[] {
  return ['全部', ...Array.from(new Set(QUESTION_BANK.map((q) => q.tag)))]
}
