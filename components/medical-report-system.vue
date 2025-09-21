<template>
  <div class="min-h-screen bg-gray-50 p-4">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">3.3.2 图文排版</h1>
      <p class="text-gray-600">
        报告生成界面分为左侧的流程图，中间的文字报告和右侧的多模态可视对比，下方则为交互编辑的对话框。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Left Panel - Flowchart -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center mb-4">
          <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <h2 class="text-lg font-semibold">流程图</h2>
        </div>
        
        <!-- Flowchart Visualization -->
        <div class="bg-purple-100 rounded-lg p-4 h-96 relative">
          <!-- Top circle -->
          <div class="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-yellow-300 rounded-full"></div>
          
          <!-- First row boxes -->
          <div class="absolute top-20 left-4 w-16 h-12 bg-cyan-200 rounded"></div>
          <div class="absolute top-20 right-4 w-16 h-12 bg-cyan-200 rounded"></div>
          
          <!-- Center diamond -->
          <div class="absolute top-40 left-1/2 transform -translate-x-1/2 w-16 h-12 bg-purple-300 rounded-lg"></div>
          
          <!-- Bottom box -->
          <div class="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-16 h-12 bg-cyan-200 rounded"></div>
          
          <!-- Bottom circle -->
          <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-yellow-300 rounded-full"></div>
          
          <!-- Arrows -->
          <svg class="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
              </marker>
            </defs>
            <line x1="50%" y1="60" x2="30%" y2="90" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)" />
            <line x1="50%" y1="60" x2="70%" y2="90" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)" />
            <line x1="30%" y1="110" x2="50%" y2="140" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)" />
            <line x1="70%" y1="110" x2="50%" y2="140" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)" />
            <line x1="50%" y1="180" x2="50%" y2="210" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)" />
            <line x1="50%" y1="240" x2="50%" y2="270" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)" />
          </svg>
        </div>
        
        <!-- Edit button -->
        <button class="mt-4 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </button>
      </div>

      <!-- Center Panel - Medical Report -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center mb-4">
          <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h2 class="text-lg font-semibold">医疗报告</h2>
        </div>
        
        <div class="space-y-4 text-sm">
          <div class="text-center font-bold text-lg">超声医学检查报告</div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>姓名：XXX</div>
            <div>性别：男/女</div>
            <div>年龄：XX岁</div>
            <div>检查号：XXXXXX</div>
          </div>
          
          <div>检查部位：XXXX年XX月XX日</div>
          <div>临床诊断：肥胖/高血压/糖尿病/无症状</div>
          <div class="text-center">超声检查描述</div>
          
          <hr class="border-gray-300" />
          
          <div>
            <div class="font-semibold mb-2">肝脏：</div>
            <ul class="list-disc list-inside space-y-1 text-xs">
              <li>肝脏形态饱满，体积轻度增大（或正常），包膜光滑，边缘锐利。</li>
              <li>肝实质回声弥漫性增强，呈细颗粒状，前场回声减弱，后场回声减弱，深部肝脏显示不清。</li>
              <li>肝内管道结构（门静脉、肝静脉）显示模糊，管壁回声增强。</li>
              <li>肝内未见明显占位性病变。</li>
              <li>彩色多普勒血流显像（CDFI）：肝内血流信号显示减少，门静脉血流速度正常（可补充具体数值，如XX cm/s）。</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Right Panel - Analysis and Comparison -->
      <div class="space-y-6">
        <!-- Visual Analysis -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center mb-4">
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <h2 class="text-lg font-semibold">可视分析</h2>
          </div>
          
          <!-- Radar Chart -->
          <div class="bg-gray-50 rounded-lg p-4 h-48 flex items-center justify-center">
            <canvas ref="radarChart" width="200" height="200" class="max-w-full max-h-full"></canvas>
          </div>
          
          <button class="mt-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </button>
        </div>

        <!-- Image Comparison -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center mb-4">
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <h2 class="text-lg font-semibold">图像对比</h2>
          </div>
          
          <!-- Image Grid -->
          <div class="grid grid-cols-2 gap-2 mb-4">
            <div v-for="i in 4" :key="i" class="aspect-square bg-gray-900 rounded-lg overflow-hidden">
              <img 
                :src="`/placeholder.svg?height=120&width=120&query=medical ultrasound scan ${i}`" 
                :alt="`Medical scan ${i}`"
                class="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <button class="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Input Panel -->
    <div class="bg-white rounded-lg shadow-md p-4">
      <div class="flex items-center space-x-4">
        <button class="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
        </button>
        
        <input 
          v-model="inputText"
          type="text" 
          placeholder="请输入想修改的内容"
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @keyup.enter="handleSubmit"
        />
        
        <button 
          @click="handleSubmit"
          class="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const inputText = ref('')
const radarChart = ref(null)

const handleSubmit = () => {
  if (inputText.value.trim()) {
    console.log('Submitting:', inputText.value)
    // Here you would typically send the input to your backend API
    inputText.value = ''
  }
}

const drawRadarChart = () => {
  if (!radarChart.value) return
  
  const canvas = radarChart.value
  const ctx = canvas.getContext('2d')
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radius = 80
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Draw radar chart background
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  
  // Draw concentric circles
  for (let i = 1; i <= 5; i++) {
    ctx.beginPath()
    ctx.arc(centerX, centerY, (radius * i) / 5, 0, 2 * Math.PI)
    ctx.stroke()
  }
  
  // Draw axes
  const axes = 6
  for (let i = 0; i < axes; i++) {
    const angle = (i * 2 * Math.PI) / axes - Math.PI / 2
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(x, y)
    ctx.stroke()
  }
  
  // Draw data polygon
  ctx.strokeStyle = '#3b82f6'
  ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'
  ctx.lineWidth = 2
  
  const dataPoints = [0.8, 0.6, 0.9, 0.7, 0.5, 0.8] // Sample data
  
  ctx.beginPath()
  for (let i = 0; i < axes; i++) {
    const angle = (i * 2 * Math.PI) / axes - Math.PI / 2
    const value = dataPoints[i] * radius
    const x = centerX + value * Math.cos(angle)
    const y = centerY + value * Math.sin(angle)
    
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  
  // Draw data points
  ctx.fillStyle = '#3b82f6'
  for (let i = 0; i < axes; i++) {
    const angle = (i * 2 * Math.PI) / axes - Math.PI / 2
    const value = dataPoints[i] * radius
    const x = centerX + value * Math.cos(angle)
    const y = centerY + value * Math.sin(angle)
    
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, 2 * Math.PI)
    ctx.fill()
  }
}

onMounted(() => {
  drawRadarChart()
})
</script>
