import Protagonist from '../entities/Protagonist.js';
import Ransom from '../entities/Ransom.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.player = null;
        this.cursors = null;
        this.lightRenderTexture = null;
        this.mapWidth = 4800;
        this.mapHeight = 600;
        this.darknessFactor = 1.0;
    }

    preload() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('player-sprite', 32, 32);

        graphics.clear();
        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('ransom-sprite', 32, 32);

        graphics.clear();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(128, 128, 128);
        graphics.generateTexture('light-mask', 256, 256);
    }

    create() {
        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

        // Player
        this.player = new Protagonist(this, this.mapWidth / 2, this.mapHeight / 2);

        // Ransoms
        this.ransoms = this.add.group({
            classType: Ransom,
            runChildUpdate: true
        });

        for (let i = 0; i < 20; i++) {
            const rx = Phaser.Math.Between(100, this.mapWidth - 100);
            const ry = Phaser.Math.Between(100, this.mapHeight - 100);
            const r = new Ransom(this, rx, ry);
            this.ransoms.add(r);

            // Add a simple PostFX/PreFX glitch manually in the class later 
            // but for now let's use the core pipeline features if WebGL is available
            if (this.renderer.type === Phaser.WEBGL) {
                // We typically use PreFX in newer Phaser 3
                const fx = r.postFX.addGlow(0xff0000, 4);
            }
        }

        // Spider Archangels
        this.archangels = this.physics.add.staticGroup();
        this.archangels.create(200, this.mapHeight / 2, 'player-sprite').setTint(0x00ffff);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

        this.lightRenderTexture = this.make.renderTexture({
            width: 800,
            height: 600,
            add: true
        }).setOrigin(0, 0).setScrollFactor(0);

        this.lightRenderTexture.setDepth(1000);

        // Glitch FX logic (Atmospheric)
        if (this.renderer.type === Phaser.WEBGL) {
            this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8, 0.1);
        }
    }

    update() {
        this.player.setVelocity(0);
        const speed = 200;
        if (this.cursors.left.isDown) { this.player.setVelocityX(-speed); }
        else if (this.cursors.right.isDown) { this.player.setVelocityX(speed); }
        if (this.cursors.up.isDown) { this.player.setVelocityY(-speed); }
        else if (this.cursors.down.isDown) { this.player.setVelocityY(speed); }

        const ambientDarkness = Phaser.Math.Clamp((this.player.x / (this.mapWidth / 2)), 0.0, 1.0);
        this.darknessFactor = 1.0 - ambientDarkness;

        this.updateLightingMask();
        this.updateGlitches();
    }

    updateLightingMask() {
        this.lightRenderTexture.clear();

        // Darker towards the left
        const baseAlpha = 0.4 + (0.6 * this.darknessFactor);
        this.lightRenderTexture.fill(0x000000, baseAlpha);

        const cam = this.cameras.main;
        const pScreenX = this.player.x - cam.worldView.x;
        const pScreenY = this.player.y - cam.worldView.y;

        this.lightRenderTexture.erase('light-mask', pScreenX - 128, pScreenY - 128);
    }

    updateGlitches() {
        // More glitching the deeper into the dark (Left)
        if (this.darknessFactor > 0.7 && Math.random() > 0.98) {
            this.cameras.main.shake(100, 0.005);
            // Flash a visual artifact 
            this.cameras.main.flash(50, 255, 0, 0, true);
        }
    }
}
