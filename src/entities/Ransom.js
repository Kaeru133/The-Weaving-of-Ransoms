// Phaser is global from index.html CDN

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

        this.isDamageTinted = false; // Flag para evitar inundação de timers
        // Sistema de Combate
        this.health = 30;
        this.isAttacking = false;
        this.attackDuration = 5000;
        this.attackPause = 10000;
        this.killProgress = 0; // Tempo sendo 'pisado' pelo player

        // Lasers (Shared Graphics in Scene)
        if (!scene.laserLayer) {
            scene.laserLayer = scene.add.graphics().setDepth(5);
        }

        // Iniciar ciclo de ataque
        this.scheduleAttack();
    }

    scheduleAttack() {
        if (!this.active) return;
        this.scene.time.delayedCall(this.attackPause, () => {
            if (!this.active) return;
            this.startAttack();
        });
    }

    startAttack() {
        if (!this.active) return;
        this.isAttacking = true;
        this.scene.time.delayedCall(this.attackDuration, () => {
            if (!this.active) return;
            this.stopAttack();
        });
    }

    stopAttack() {
        this.isAttacking = false;
        this.scheduleAttack();
    }

    update(time, delta) {
        if (!this.active || !this.scene) return;

        // Jitter visual (Glitch) - Apenas se estiver perto da tela
        const cam = this.scene.cameras.main;
        if (cam.worldView.contains(this.x, this.y)) {
            if (Math.random() > 0.95) {
                this.setAlpha(0.2 + Math.random() * 0.8);
                if (Math.random() > 0.5) {
                    this.x += (Math.random() - 0.5) * 5;
                }
            } else {
                this.setAlpha(1);
            }

            // Desenhar Lasers se estiver atacando
            if (this.isAttacking && this.scene.laserLayer) {
                this.drawLasers();
                this.checkLaserCollision();
            }
        }
    }

    drawLasers() {
        const layer = this.scene.laserLayer;
        layer.lineStyle(4, 0xff0000, 0.8);

        const length = 150 * (this.isBoss ? 2 : 1);
        layer.lineBetween(this.x, this.y - length, this.x, this.y + length);
        layer.lineBetween(this.x - length, this.y, this.x + length, this.y);
    }

    checkLaserCollision() {
        const player = this.scene.player;
        if (!player || player.isDead) return;

        const length = 150 * (this.isBoss ? 2 : 1);
        const pSize = 16;

        // Colisão simples por proximidade
        if (Math.abs(player.x - this.x) < (pSize + 2) && Math.abs(player.y - this.y) < length) {
            this.scene.damagePlayer(0.3);
        } else if (Math.abs(player.y - this.y) < (pSize + 2) && Math.abs(player.x - this.x) < length) {
            this.scene.damagePlayer(0.3);
        }
    }

    takeDamage(amount) {
        if (!this.active || this.health <= 0) return;
        this.health -= amount;

        // Psychological effect: Pleas for mercy
        if (Math.random() > 0.3) {
            const pleas = [
                "dont do that", "stop it", "why?", "please", "not again", "it hurts",
                "i have a family", "even you have a heart", "ahhhhhh. Stop it",
                "i'll give whatever you want", "i want to live"
            ];
            const plea = pleas[Math.floor(Math.random() * pleas.length)];
            const pleaText = this.scene.add.text(this.x, this.y - 40, plea, {
                fontSize: '16px',
                fill: '#ff0000',
                fontFamily: 'monospace',
                fontStyle: 'italic'
            }).setOrigin(0.5).setDepth(2000);

            this.scene.tweens.add({
                targets: pleaText,
                y: this.y - 80,
                alpha: 0,
                duration: 2000,
                onComplete: () => pleaText.destroy()
            });
        }

        if (!this.isDamageTinted) {
            this.isDamageTinted = true;
            
            // Brief flicker and scale up slightly for impact
            const originalAlpha = this.alpha;
            const originalScale = this.scaleX;
            this.setAlpha(0.5);
            this.setScale(originalScale * 1.1);
            
            this.scene.time.delayedCall(100, () => {
                if (this.active) {
                    this.setAlpha(originalAlpha);
                    this.setScale(originalScale);
                    this.isDamageTinted = false;
                }
            });
        }
        if (this.health <= 0) {
            this.scene.collectRansom(null, this);
        }
    }

    destroy() {
        super.destroy();
    }
}
