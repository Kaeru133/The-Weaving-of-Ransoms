import Phaser from 'phaser';

export default class Ransom extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'ransom-sprite');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);

        // Initializing movements or AI
        this.setVelocity(
            Phaser.Math.Between(-100, 100),
            Phaser.Math.Between(-100, 100)
        );
        this.setBounce(1);
    }

    update() {
        // Glitch jitter logic can go here for frame skipping simulation
        if (Math.random() > 0.95) {
            this.setAlpha(0.2 + Math.random() * 0.8);
            if (Math.random() > 0.5) {
                this.x += (Math.random() - 0.5) * 10;
            }
        } else {
            this.setAlpha(1);
        }
    }
}
