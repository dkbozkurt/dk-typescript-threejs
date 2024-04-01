import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'
import TWEEN from '@tweenjs/tween.js'

const scene = new THREE.Scene()
scene.add(new THREE.AxesHelper(5))

const light1 = new THREE.SpotLight(0xffffff, 100)
light1.position.set(2.5, 5, 2.5)
light1.angle = Math.PI / 8
light1.penumbra = 0.5
light1.castShadow = true
light1.shadow.mapSize.width = 1024
light1.shadow.mapSize.height = 1024
light1.shadow.camera.near = 0.5
light1.shadow.camera.far = 20
scene.add(light1)

const light2 = new THREE.SpotLight(0xffffff, 100)
light2.position.set(-2.5, 5, 2.5)
light2.angle = Math.PI / 8
light2.penumbra = 0.5
light2.castShadow = true
light2.shadow.mapSize.width = 1024
light2.shadow.mapSize.height = 1024
light2.shadow.camera.near = 0.5
light2.shadow.camera.far = 20
scene.add(light2)

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(0.8, 1.4, 1.0)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 1, 0)

const sceneMeshes: THREE.Mesh[] = []

const planeGeometry = new THREE.PlaneGeometry(25, 25)
const texture = new THREE.TextureLoader().load('img/grid.png')
const plane = new THREE.Mesh(
    planeGeometry,
    new THREE.MeshPhongMaterial({ map: texture })
)
plane.rotateX(-Math.PI / 2)
plane.receiveShadow = true
scene.add(plane)
sceneMeshes.push(plane)

let mixer: THREE.AnimationMixer
let modelReady = false
let modelMesh: THREE.Object3D
const animationActions: THREE.AnimationAction[] = []
let activeAction: THREE.AnimationAction
let lastAction: THREE.AnimationAction
const gltfLoader = new GLTFLoader()

gltfLoader.load(
    'models/vanguard.glb',
    (gltf) => {
        gltf.scene.traverse(function (child) {
            if ((child as THREE.Mesh).isMesh) {
                const m = child as THREE.Mesh
                m.castShadow = true
                m.frustumCulled = false
            }
        })

        mixer = new THREE.AnimationMixer(gltf.scene)

        const animationAction = mixer.clipAction((gltf as any).animations[0])
        animationActions.push(animationAction)
        animationsFolder.add(animations, 'default')
        activeAction = animationActions[0]

        scene.add(gltf.scene)
        modelMesh = gltf.scene

        //add an animation from another file
        gltfLoader.load(
            'models/vanguard@samba.glb',
            (gltf) => {
                console.log('loaded samba')
                const animationAction = mixer.clipAction(
                    (gltf as any).animations[0]
                )
                animationActions.push(animationAction)
                animationsFolder.add(animations, 'samba')

                //add an animation from another file
                gltfLoader.load(
                    'models/vanguard@bellydance.glb',
                    (gltf) => {
                        console.log('loaded bellydance')
                        const animationAction = mixer.clipAction(
                            (gltf as any).animations[0]
                        )
                        animationActions.push(animationAction)
                        animationsFolder.add(animations, 'bellydance')

                        //add an animation from another file
                        gltfLoader.load(
                            'models/vanguard@goofyrunning.glb',
                            (gltf) => {
                                console.log('loaded goofyrunning')
                                ;(gltf as any).animations[0].tracks.shift() //delete the specific track that moves the object forward while running
                                const animationAction = mixer.clipAction(
                                    (gltf as any).animations[0]
                                )
                                animationActions.push(animationAction)
                                animationsFolder.add(animations, 'goofyrunning')

                                modelReady = true
                            },
                            (xhr) => {
                                console.log(
                                    (xhr.loaded / xhr.total) * 100 + '% loaded'
                                )
                            },
                            (error) => {
                                console.log(error)
                            }
                        )
                    },
                    (xhr) => {
                        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
                    },
                    (error) => {
                        console.log(error)
                    }
                )
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                console.log(error)
            }
        )
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
        console.log(error)
    }
)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const raycaster = new THREE.Raycaster()
const targetQuaternion = new THREE.Quaternion()
const mouse = new THREE.Vector2()

function onDoubleClick(event: MouseEvent) {
    mouse.set(
        (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    )
    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects(sceneMeshes, false)

    if (intersects.length > 0) {
        const p = intersects[0].point

        const distance = modelMesh.position.distanceTo(p) // calculate distance so we can use it to change time of running depends on the distance.

        //modelMesh.lookAt(p)

        // Our model will look a the target point while tweening by the helping of the following functions.
        const rotationMatrix = new THREE.Matrix4()
        rotationMatrix.lookAt(p, modelMesh.position, modelMesh.up)
        targetQuaternion.setFromRotationMatrix(rotationMatrix)

        setAction(animationActions[3])

        TWEEN.removeAll() // Cleans all tweens
        new TWEEN.Tween(modelMesh.position)
            .to(
                {
                    x: p.x,
                    y: p.y,
                    z: p.z,
                },
                (1000 / 2.2) * distance
            ) //walks 2 meters a second * the distance
            .onUpdate(() => {
                controls.target.set( // Camera is looking at the target.
                    modelMesh.position.x,
                    modelMesh.position.y + 1,
                    modelMesh.position.z
                )
                // Lights are looking at the target.
                light1.target = modelMesh
                light2.target = modelMesh
            })
            .start()
            .onComplete(() => {
                setAction(animationActions[2])
                activeAction.clampWhenFinished = true // This will avoid the animation to go to default but stay in the last frame of the animation.
                activeAction.loop = THREE.LoopOnce // It will loop the animation once and
            })
    }
}
renderer.domElement.addEventListener('dblclick', onDoubleClick, false)

const stats = new Stats()
document.body.appendChild(stats.dom)

const animations = {
    default: function () {
        setAction(animationActions[0])
    },
    samba: function () {
        setAction(animationActions[1])
    },
    bellydance: function () {
        setAction(animationActions[2])
    },
    goofyrunning: function () {
        setAction(animationActions[3])
    },
}

const setAction = (toAction: THREE.AnimationAction) => {
    if (toAction != activeAction) {
        lastAction = activeAction
        activeAction = toAction
        //lastAction.stop()
        lastAction.fadeOut(0.2)
        activeAction.reset()
        activeAction.fadeIn(0.2)
        activeAction.play()
    }
}

const gui = new GUI()
const animationsFolder = gui.addFolder('Animations')
animationsFolder.open()

const clock = new THREE.Clock()
let delta = 0

function animate() {
    requestAnimationFrame(animate)

    controls.update()

    if (modelReady) {
        delta = clock.getDelta()
        mixer.update(delta)

        // Slowly turning to target!
        if (!modelMesh.quaternion.equals(targetQuaternion)) {
            modelMesh.quaternion.rotateTowards(targetQuaternion, delta * 10)
        }
    }

    TWEEN.update()

    render()

    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()