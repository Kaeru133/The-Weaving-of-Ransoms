import Phaser from 'phaser';

export default class Archangel extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player-sprite');
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body
        this.setTint(0x00ffff);

        // Add a glowing effect if possible or just high contrast
        this.setAlpha(0.8);
    }

    update() {
        // Subtle hover/glow animation
        this.setAlpha(0.6 + Math.sin(this.scene.time.now / 500) * 0.4);
    }
}
