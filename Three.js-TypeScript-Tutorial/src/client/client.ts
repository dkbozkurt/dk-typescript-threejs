import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'

const scene = new THREE.Scene()

const light = new THREE.DirectionalLight(0xffffff, 5)
light.position.set(10, 5, 2)
light.castShadow = true
light.shadow.mapSize.width = 256
light.shadow.mapSize.height = 256
light.shadow.camera.near = 0.5
light.shadow.camera.far = 25
light.shadow.camera.left = -10
light.shadow.camera.right = 10
light.shadow.camera.top = 10
light.shadow.camera.bottom = -10
light.shadow.radius = 5
light.shadow.blurSamples = 25

scene.add(light)

const helper = new THREE.CameraHelper(light.shadow.camera)
scene.add(helper)

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(9, 0.75, 3)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.VSMShadowMap
//renderer.shadowMap.type = THREE.PCFShadowMap
//renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

new OrbitControls(camera, renderer.domElement)

const planeGeometry = new THREE.PlaneGeometry(100, 20)
const plane = new THREE.Mesh(planeGeometry, new THREE.MeshPhongMaterial())
plane.rotateX(-Math.PI / 2)
plane.position.y = -1.75
plane.receiveShadow = true
scene.add(plane)

const torusGeometry = [
    new THREE.TorusGeometry(),
    new THREE.TorusGeometry(),
    new THREE.TorusGeometry(),
    new THREE.TorusGeometry(),
    new THREE.TorusGeometry(),
]

const material = [
    new THREE.MeshBasicMaterial(),
    new THREE.MeshLambertMaterial(),
    new THREE.MeshPhongMaterial(),
    new THREE.MeshPhysicalMaterial({}),
    new THREE.MeshToonMaterial(),
]

const torus = [
    new THREE.Mesh(torusGeometry[0], material[0]),
    new THREE.Mesh(torusGeometry[1], material[1]),
    new THREE.Mesh(torusGeometry[2], material[2]),
    new THREE.Mesh(torusGeometry[3], material[3]),
    new THREE.Mesh(torusGeometry[4], material[4]),
]

const texture = new THREE.TextureLoader().load('img/grid.png')
material[0].map = texture
material[1].map = texture
material[2].map = texture
material[3].map = texture
material[4].map = texture

torus[0].position.x = -8
torus[1].position.x = -4
torus[2].position.x = 0
torus[3].position.x = 4
torus[4].position.x = 8

torus[0].castShadow = true
torus[1].castShadow = true
torus[2].castShadow = true
torus[3].castShadow = true
torus[4].castShadow = true

torus[0].receiveShadow = true
torus[1].receiveShadow = true
torus[2].receiveShadow = true
torus[3].receiveShadow = true
torus[4].receiveShadow = true

scene.add(torus[0])
scene.add(torus[1])
scene.add(torus[2])
scene.add(torus[3])
scene.add(torus[4])

camera.lookAt(torus[3].position)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const stats = new Stats()
document.body.appendChild(stats.dom)

const data = {
    color: light.color.getHex(),
    mapsEnabled: true,
    shadowMapSizeWidth: 512,
    shadowMapSizeHeight: 512,
}

const gui = new GUI()
const lightFolder = gui.addFolder('THREE.Light')
lightFolder.addColor(data, 'color').onChange(() => {
    light.color.setHex(Number(data.color.toString().replace('#', '0x')))
})
lightFolder.add(light, 'intensity', 0, 10, 0.01)

const directionalLightFolder = gui.addFolder('THREE.DirectionalLight')
directionalLightFolder.add(light.shadow, 'radius', 0, 25, 1)
directionalLightFolder.add(light.shadow, 'blurSamples', 1, 25, 1)
directionalLightFolder.open()

function animate() {
    requestAnimationFrame(animate)

    helper.update()

    torus.forEach((t) => {
        t.rotation.y += 0.01
    })

    render()

    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()