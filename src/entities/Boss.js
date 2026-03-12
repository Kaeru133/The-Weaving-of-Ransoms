// Phaser is global from index.html CDN
import Ransom from './Ransom.js';

export default class Boss extends Ransom {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.setScale(0.6); // Match the scale used in GameScene
        // Removed setTint(0xff0000) to avoid 'red square' artifact in CANVAS mode
        this.health = 500;
        this.maxHealth = 500;
        this.isBoss = true;

        this.bossText = scene.add.text(x, y - 60, 'KING RANSOM', {
            fontSize: '20px',
            fill: '#ff0000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Removendo PostFX temporariamente para evitar falhas de WebGL
        // if (scene.renderer.type === Phaser.WEBGL) {
        //    this.postFX.addGlow(0xff0000, 6, 0.8);
        // }
    }

    update(time, delta) {
        super.update(time, delta);
        if (this.bossText) {
            this.bossText.setPosition(this.x, this.y - 60);
        }
    }

    destroy() {
        if (this.bossText) this.bossText.destroy();
        super.destroy();
    }
}
