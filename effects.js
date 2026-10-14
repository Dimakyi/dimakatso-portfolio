
(() => {
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const finePointer = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
    );

    if (reducedMotion.matches || !finePointer.matches) {
        return;
    }

    const canvas = document.createElement("canvas");
    canvas.id = "idea-network";
    canvas.setAttribute("aria-hidden", "true");

    Object.assign(canvas.style, {
        position: "fixed",
        inset: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: "0",
        opacity: "0.85"
    });

    document.body.prepend(canvas);

    const context = canvas.getContext("2d");
    if (!context) {
        canvas.remove();
        return;
    }

    let width = 0;
    let height = 0;
    let nodes = [];
    let twinkles = [];
    let mouse = { x: -1000, y: -1000 };
    let sparks = [];
    let animationFrame;

    function resize() {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);

        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = width * ratio;
        canvas.height = height * ratio;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);

        const count = Math.min(
            75,
            Math.max(25, Math.floor((width * height) / 18000))
        );

        twinkles = Array.from({ length: 38 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 0.5 + Math.random() * 1,
            phase: Math.random() * Math.PI * 2
        }));
        nodes = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: 1 + Math.random() * 1.5,
            phase: Math.random() * Math.PI * 2
        }));
    }

    function draw() {
        context.clearRect(0, 0, width, height);

        twinkles.forEach(twinkle => {
            twinkle.phase += 0.018;

            const shimmer = 0.10 + (Math.sin(twinkle.phase) + 1) * 0.09;

            context.beginPath();
            context.arc(
                twinkle.x, twinkle.y,
                twinkle.size,
                0, Math.PI * 2
            );
            context.fillStyle = `rgba(255, 159, 67, ${shimmer})`;
            context.fill();
        });
        nodes.forEach((node, index) => {
            const distanceToMouse = Math.hypot(
                node.x - mouse.x,
                node.y - mouse.y
            );

            const glow = Math.max(0, 1 - distanceToMouse / 150);

            for (let next = index + 1; next < nodes.length; next++) {
                const other = nodes[next];
                const distance = Math.hypot(
                    node.x - other.x,
                    node.y - other.y
                );

                if (distance < 145) {
                    context.beginPath();
                    context.moveTo(node.x, node.y);
                    context.lineTo(other.x, other.y);
                    context.strokeStyle =
                        `rgba(255, 134, 26, ${0.13 * (1 - distance / 145) + glow * 0.18})`;
                    context.lineWidth = 1;
                    context.stroke();
                }
            }

            context.beginPath();
            context.arc(
                node.x,
                node.y,
                node.radius + glow * 3,
                0,
                Math.PI * 2
            );
            context.fillStyle = `rgba(255, 159, 67, ${0.45 + glow * 0.5})`;
            context.shadowColor = "#FF861A";
            context.shadowBlur = glow * 18;
            context.fill();
            context.shadowBlur = 0;
        });

        if (mouse.x >= 0 && mouse.y >= 0 &&
            mouse.x <= width && mouse.y <= height) {
            const halo = context.createRadialGradient(
                mouse.x, mouse.y, 0,
                mouse.x, mouse.y, 65
            );

            halo.addColorStop(0, "rgba(255, 134, 26, 0.12)");
            halo.addColorStop(0.4, "rgba(255, 134, 26, 0.04)");
            halo.addColorStop(1, "rgba(255, 134, 26, 0)");

            context.fillStyle = halo;
            context.beginPath();
            context.arc(mouse.x, mouse.y, 65, 0, Math.PI * 2);
            context.fill();
        }

        sparks = sparks.filter(spark => spark.life > 0);

        sparks.forEach(spark => {
            spark.x += spark.vx;
            spark.y += spark.vy;
            spark.life -= 0.025;

            context.beginPath();
            context.moveTo(spark.x, spark.y);
            context.lineTo(
                spark.x - spark.vx * 5,
                spark.y - spark.vy * 5
            );
            context.strokeStyle =
                `rgba(255, 159, 67, ${Math.max(0, spark.life) * 0.65})`;
            context.lineWidth = Math.max(0.4, spark.size * spark.life);
            context.stroke();
        });
        animationFrame = window.requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);

    window.addEventListener("pointermove", (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    }, { passive: true });

    window.addEventListener("pointerleave", () => {
        mouse = { x: -1000, y: -1000 };
    });

    resize();
    draw();
})();

(() => {
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );
    const finePointer = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
    );

    if (reducedMotion.matches || !finePointer.matches) {
        return;
    }

    const image = new Image();
    image.src = "images/gotrolly-sketch-background.png";
    const wall = document.createElement("canvas");
    wall.id = "gotrolly-wall";

    wall.setAttribute("aria-hidden", "true");

    Object.assign(wall.style, {
        position: "absolute",
        top: "8rem",
        left: "5%",
        width: "min(48vw, 580px)",
        height: "auto",
        pointerEvents: "none",
        zIndex: "-1",
        overflow: "visible"
    });

    document.body.prepend(wall);

    const ctx = wall.getContext("2d");
    if (!ctx) {
        wall.remove();
        return;
    }

    const blockSize = 24;
    const hiddenDuration = 5000
;
    let blocks = [];
    let phase = "ready";
    let startTime = 0;
    let rebuildTime = 0;
    let animationId = 0;
    let wallWidth = 0;
    let wallHeight = 0;
    let pointer = { x: -1000, y: -1000 };

    function layout() {
        if (!image.complete || !image.naturalWidth) return;

        const mobile = window.innerWidth <= 600;
        const cssWidth = mobile
            ? Math.min(window.innerWidth * 0.65, 300)
            : Math.min(window.innerWidth * 0.48, 580);

        wallWidth = cssWidth;
        wallHeight = cssWidth * image.naturalHeight / image.naturalWidth;

        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        wall.width = Math.ceil(wallWidth * ratio);
        wall.height = Math.ceil(wallHeight * ratio);
        wall.style.width = `${wallWidth}px`;
        wall.style.height = `${wallHeight}px`;
        wall.style.left = mobile ? "3%" : "5%";
        wall.style.top = mobile ? "6rem" : "8rem";

        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        createBlocks();
        drawWall();
    }

    function createBlocks() {
        blocks = [];
        const columns = Math.ceil(wallWidth / blockSize);
        const rows = Math.ceil(wallHeight / blockSize);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const x = col * blockSize;
                const y = row * blockSize;
                const w = Math.min(blockSize, wallWidth - x);
                const h = Math.min(blockSize, wallHeight - y);

                blocks.push({
                    x, y, w, h,
                    delay: Math.random() * 350,
                    vx: (Math.random() - 0.5) * 5,
                    vy: 2 + Math.random() * 5,
                    spin: (Math.random() - 0.5) * 0.18,
                    angle: 0,
                    alpha: 1,
                    settled: false
                });
            }
        }
    }

    function drawWall() {
        ctx.clearRect(0, 0, wallWidth, wallHeight);
        ctx.drawImage(image, 0, 0, wallWidth, wallHeight);
    }

    function collapse(now) {
        phase = "falling";
        startTime = now;

        blocks.forEach(block => {
            block.vx += (Math.random() - 0.5) * 3;
            block.vy = 1 + Math.random() * 4;
            block.delay = Math.random() * 420;
            block.angle = 0;
            block.settled = false;
        });

        animate(now);
    }

    function animate(now) {
        ctx.clearRect(0, 0, wallWidth, wallHeight);

        const elapsed = now - startTime;

        if (phase === "falling") {
            blocks.forEach(block => {
                const progress = Math.max(0, elapsed - block.delay);

                if (progress > 0) {
                    const fall = progress / 16;
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, 1 - fall / 500);
                    ctx.translate(
                        block.x + block.w / 2 + block.vx * fall,
                        block.y + block.h / 2 + fall * block.vy
                    );
                    ctx.rotate(block.spin * fall / 10);
                    ctx.drawImage(
                        image,
                        block.x * image.naturalWidth / wallWidth,
                        block.y * image.naturalHeight / wallHeight,
                        block.w * image.naturalWidth / wallWidth,
                        block.h * image.naturalHeight / wallHeight,
                        -block.w / 2, -block.h / 2,
                        block.w, block.h
                    );
                    ctx.restore();
                }
            });

            if (elapsed > 1200) {
                phase = "hidden";
                rebuildTime = now + hiddenDuration;
                ctx.clearRect(0, 0, wallWidth, wallHeight);
		animationId = window.requestAnimationFrame(animate);
                return;
            }
        } else if (phase === "rebuilding") {
            const progress = Math.min(1, elapsed / 1400);
            const visibleCount = Math.floor(blocks.length * progress);

            blocks.slice(0, visibleCount).forEach(block => {
                ctx.drawImage(
                    image,
                    block.x * image.naturalWidth / wallWidth,
                    block.y * image.naturalHeight / wallHeight,
                    block.w * image.naturalWidth / wallWidth,
                    block.h * image.naturalHeight / wallHeight,
                    block.x, block.y, block.w, block.h
                );
            });

            if (progress >= 1) {
                phase = "ready";
                drawWall();
                return;
            }
        } else if (phase === "hidden") {
    if (now >= rebuildTime) {
        phase = "rebuilding";
        startTime = now;
    } else {
        animationId = window.requestAnimationFrame(animate);
        return;
    }
}

        animationId = window.requestAnimationFrame(animate);
    }

    function pointerMove(event) {
        pointer.x = event.clientX;
        pointer.y = event.clientY;

        if (phase !== "ready") return;

        const rect = wall.getBoundingClientRect();
        const inside = pointer.x >= rect.left &&
            pointer.x <= rect.right &&
            pointer.y >= rect.top &&
            pointer.y <= rect.bottom;

        if (inside) collapse(performance.now());
    }

    image.addEventListener("load", layout);
    window.addEventListener("resize", layout);
    window.addEventListener("pointermove", pointerMove, { passive: true });

    if (image.complete && image.naturalWidth) layout();
})();
