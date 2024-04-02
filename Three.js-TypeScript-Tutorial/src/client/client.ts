import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'
import * as CANNON from 'cannon-es'

const scene = new THREE.Scene()
scene.add(new THREE.AxesHelper(5))

const light1 = new THREE.SpotLight(0xffffff, 100)
light1.position.set(2.5, 5, 5)
light1.angle = Math.PI / 4
light1.penumbra = 0.5
light1.castShadow = true
light1.shadow.mapSize.width = 1024
light1.shadow.mapSize.height = 1024
light1.shadow.camera.near = 0.5
light1.shadow.camera.far = 20
scene.add(light1)

const light2 = new THREE.SpotLight(0xffffff, 100)
light2.position.set(-2.5, 5, 5)
light2.angle = Math.PI / 4
light2.penumbra = 0.5
light2.castShadow = true
light2.shadow.mapSize.width = 1024
light2.shadow.mapSize.height = 1024
light2.shadow.camera.near = 0.5
light2.shadow.camera.far = 20
scene.add(light2)

scene.background = new THREE.CubeTextureLoader().load([
    'img/px_eso0932a.jpg',
    'img/nx_eso0932a.jpg',
    'img/py_eso0932a.jpg',
    'img/ny_eso0932a.jpg',
    'img/pz_eso0932a.jpg',
    'img/nz_eso0932a.jpg',
])

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(0.5, 0.5, 6)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.y = 0.5

const world = new CANNON.World()
world.gravity.set(0, -1, 0) // setting minimal gravity otherwise you lose friction calculations

const moonMaterial = new THREE.MeshStandardMaterial()
let texture = new THREE.TextureLoader().load('img/moon_540x270.jpg')
moonMaterial.map = texture

const sphereMeshes: THREE.Mesh[] = []
const sphereBodies: CANNON.Body[] = []

for (let x = 0; x < 100; x++) {
    const sphereGeometry = new THREE.SphereGeometry(0.5)
    sphereMeshes.push(new THREE.Mesh(sphereGeometry, moonMaterial))
    sphereMeshes[x].position.x = Math.random() * 100 - 50
    sphereMeshes[x].position.y = Math.random() * 100 - 50
    sphereMeshes[x].position.z = Math.random() * 100 - 50
    sphereMeshes[x].castShadow = true
    sphereMeshes[x].receiveShadow = true
    scene.add(sphereMeshes[x])

    const sphereShape = new CANNON.Sphere(0.5)
    sphereBodies.push(new CANNON.Body({ mass: 1 }))
    sphereBodies[x].addShape(sphereShape)
    sphereBodies[x].position.x = sphereMeshes[x].position.x
    sphereBodies[x].position.y = sphereMeshes[x].position.y
    sphereBodies[x].position.z = sphereMeshes[x].position.z
    world.addBody(sphereBodies[x])
}

world.addEventListener('postStep', function () {
    // Gravity towards (0,0,0)
    sphereBodies.forEach((s) => {
        const v = new CANNON.Vec3()
        v.set(-s.position.x, -s.position.y, -s.position.z).normalize()
        v.scale(9.8, s.force)
        s.applyLocalForce(v)
        s.force.y += s.mass //cancel out world gravity
    })
})

const button = {
    explode: function () {
        sphereBodies.forEach((s) => {
            s.force.set(s.position.x, s.position.y, s.position.z).normalize()
            s.velocity = s.force.scale(Math.random() * 50)
        })
    },
}

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const stats = new Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()
gui.add(button, 'explode')

const clock = new THREE.Clock()
let delta

function animate() {
    requestAnimationFrame(animate)

    controls.update()

    delta = Math.min(clock.getDelta(), 0.1)
    world.step(delta)

    sphereBodies.forEach((s, i) => {
        sphereMeshes[i].position.set(s.position.x, s.position.y, s.position.z)
        sphereMeshes[i].quaternion.set(
            s.quaternion.x,
            s.quaternion.y,
            s.quaternion.z,
            s.quaternion.w
        )
    })

    render()

    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()