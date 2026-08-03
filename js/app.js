class KitchenDesigner {
    constructor() {
        this.editor2d = null;
        this.scene3d = null;
        this.is3DView = false;
        this.currentCategory = 'base';
        this.searchQuery = '';
        this.selectedModelVariantByModule = {};
        this.tutorialStep = 0;
        this.roomHasCeiling = true;
        this.isShowroomMode = false;
        this.tutorialSeenKey = 'kitchen-designer-tutorial-v2';
        this.autosaveTimer = null;
        this.toastTimer = null;
        this.storageKey = 'kitchen-design-v2';
        this.planRepository = new LocalPlanRepository({
            read: key => this.readLocal(key),
            write: (key, value) => this.writeLocal(key, value),
            remove: key => this.removeLocal(key),
            indexKey: 'kitchen-design-plan-index-v1',
            activeKey: 'kitchen-design-active-plan-v1',
            recordPrefix: 'kitchen-design-plan-v1:'
        });
        this.activePlanId = null;
        this.lastPlanSignature = '';
        this.previewObserver = null;
        this.pathPreview = null;
        this.pathPreviewScriptPromise = null;
        this.libraryDrawerOpen = false;
        this.mobileInspectorExplicit = false;
        this.appUpdate = {
            release: null,
            downloadId: null,
            phase: 'idle',
            pollTimer: null,
            checkPromise: null,
            automaticCheckTimer: null,
            progress: null,
            message: ''
        };
        this.interactionFx = {
            canvas: null,
            context: null,
            particles: [],
            frame: null,
            reduceMotion: false,
            lastBurstAt: 0
        };
        this.ambientFx = {
            canvas: null,
            context: null,
            particles: [],
            frame: null,
            reduceMotion: false,
            pointer: {
                x: 0,
                y: 0,
                active: false
            }
        };
        this.revealObserver = null;
        this.init();
    }

    init() {
        if (window.lucide) window.lucide.createIcons();
        this.editor2d = new Editor2D(document.getElementById('canvas-2d'));
        this.bindEditorCallbacks();
        this.bindEvents();
        this.setupAmbientParticles();
        this.setupInteractionFx();
        this.setupRevealMotion();
        this.renderModuleList();
        this.setRoom(false);
        this.setupTutorial();

        if (this.consumeResetQuery()) {
            this.updateDashboard();
            this.updateZoomLabel(this.editor2d.scale);
            window.setTimeout(() => this.showToast('已清空 Chrome 本地旧方案'), 120);
        } else if (!this.loadSavedProject()) {
            this.updateDashboard();
            this.updateZoomLabel(this.editor2d.scale);
        }
        if (!this.readLocal(this.tutorialSeenKey)) {
            window.setTimeout(() => this.openTutorial(), 350);
        }
        this.finishInitialLoad();
        this.clearNativePwaCache();
        this.scheduleAutomaticAppUpdateCheck();
    }

    bindEditorCallbacks() {
        this.editor2d.onSelect = cabinet => {
            this.showPropPanel(cabinet);
            if (cabinet && this.editor2d.lastPlacementAdjusted) {
                this.editor2d.lastPlacementAdjusted = false;
                this.showToast('落点已有同层模块，已自动错开放置');
            }
            // Selection can be cleared from the 2D editor after a delete. Mirror it
            // into 3D so stale outline meshes never remain in the rendered space.
            if (this.scene3d && this.scene3d.selectedCabinetId !== (cabinet?.id || null)) {
                this.scene3d.selectCabinet3D(cabinet?.id || null);
            }
        };
        this.editor2d.onUpdate = () => {
            if (this.scene3d) this.sync3D();
            this.updateDashboard();
            this.updateSelectionMeta();
            this.scheduleAutosave();
        };
        this.editor2d.onScaleChange = scale => this.updateZoomLabel(scale);
        this.editor2d.onHistoryChange = state => this.updateHistoryButtons(state);
        this.editor2d.onModeChange = state => this.update2DToolState(state);
    }

    ensureScene3D() {
        if (this.scene3d) return this.scene3d;
        this.scene3d = new Scene3D(document.getElementById('canvas-3d'));
        this.scene3d.onCabinetSelect = (cabinetId) => {
            if (cabinetId) {
                const cabinet = this.editor2d.cabinets.find(c => c.id === cabinetId);
                if (cabinet) {
                    this.editor2d.selectedCabinet = cabinet;
                    this.showPropPanel(cabinet);
                }
            } else {
                this.editor2d.deselect();
            }
        };
        this.scene3d.setRoom(this.editor2d.roomWidth, this.editor2d.roomLength, { hasCeiling: this.roomHasCeiling });
        const lightingSelect = document.getElementById('lighting-preset');
        if (lightingSelect) lightingSelect.value = this.scene3d.lightingPreset;
        this.sync3D();
        return this.scene3d;
    }

    isCompactDevice() {
        return Boolean(window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth <= 680);
    }

    visualPixelRatio() {
        const cap = this.isCompactDevice() ? 1.5 : 2;
        return Math.min(window.devicePixelRatio || 1, cap);
    }

    canUseLibraryDrawer() {
        return window.matchMedia(
            '(max-width: 860px), (orientation: landscape) and (max-height: 560px) and (max-width: 1180px)'
        ).matches;
    }

    bindEvents() {
        document.getElementById('btn-2d').addEventListener('click', () => this.switchView(false));
        document.getElementById('btn-3d').addEventListener('click', () => this.switchView(true));
        document.getElementById('btn-dock-2d').addEventListener('click', () => this.switchView(false));
        document.getElementById('btn-dock-3d').addEventListener('click', () => this.switchView(true));
        document.getElementById('btn-dock-eye').addEventListener('click', () => this.switchView(true));
        document.getElementById('btn-dock-reset').addEventListener('click', () => {
            this.switchView(true);
            this.ensureScene3D().setCameraView('perspective');
        });
        document.getElementById('btn-set-room').addEventListener('click', () => this.setRoom());
        document.getElementById('room-ceiling').addEventListener('change', () => this.setRoom());
        document.getElementById('btn-undo').addEventListener('click', () => this.editor2d.undo());
        document.getElementById('btn-redo').addEventListener('click', () => this.editor2d.redo());
        document.getElementById('btn-save').addEventListener('click', () => this.save(false));
        document.getElementById('btn-help').addEventListener('click', () => this.openTutorial());
        document.getElementById('btn-app-update')?.addEventListener('click', () => this.openAppUpdate());
        document.getElementById('btn-app-update-close')?.addEventListener('click', () => this.closeAppUpdate());
        document.getElementById('btn-app-update-dismiss')?.addEventListener('click', () => this.closeAppUpdate());
        document.getElementById('btn-app-update-action')?.addEventListener('click', () => this.handleAppUpdateAction());
        document.getElementById('app-update')?.addEventListener('click', event => {
            if (event.target === event.currentTarget) this.closeAppUpdate();
        });
        document.getElementById('btn-preview-render').addEventListener('click', () => this.openPathTracingPreview());
        document.getElementById('btn-showroom').addEventListener('click', () => this.enterShowroom());
        document.getElementById('btn-export').addEventListener('click', () => this.exportImage());
        document.getElementById('btn-path-preview-close')?.addEventListener('click', () => this.closePathTracingPreview());
        document.getElementById('btn-path-preview-save')?.addEventListener('click', () => this.savePathTracingPreview());
        document.getElementById('btn-path-preview-walk')?.addEventListener('click', () => this.enterClientWalkthrough());
        document.getElementById('btn-path-preview-zoom-out')?.addEventListener('click', () => this.zoomPathPreview(1 / 1.2));
        document.getElementById('btn-path-preview-zoom-in')?.addEventListener('click', () => this.zoomPathPreview(1.2));
        document.getElementById('btn-path-preview-zoom-reset')?.addEventListener('click', () => this.resetPathPreviewView());
        document.getElementById('btn-path-preview-webgl')?.addEventListener('click', () => this.exportCurrentSceneImage());
        document.getElementById('btn-library-toggle')?.addEventListener('click', () => this.toggleLibraryDrawer());
        document.getElementById('btn-dock-plans')?.addEventListener('click', () => this.openPlanLibrary());
        document.getElementById('library-drawer-scrim')?.addEventListener('click', () => this.toggleLibraryDrawer(false));
        window.addEventListener('resize', () => {
            if (!this.canUseLibraryDrawer()) {
                this.toggleLibraryDrawer(false, { force: true });
            }
            this.showPropPanel(this.editor2d?.selectedCabinet || null);
        });

        document.querySelectorAll('.tab-btn').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(tab => tab.classList.remove('active'));
                button.classList.add('active');
                this.currentCategory = button.dataset.tab;
                this.renderModuleList();
            });
        });

        document.getElementById('module-search').addEventListener('input', event => {
            this.searchQuery = event.target.value.trim().toLowerCase();
            this.renderModuleList();
        });

        document.getElementById('btn-zoom-out').addEventListener('click', () => this.editor2d.zoomBy(-15));
        document.getElementById('btn-zoom-in').addEventListener('click', () => this.editor2d.zoomBy(15));
        document.getElementById('btn-fit').addEventListener('click', () => this.editor2d.fitToRoom());
        document.getElementById('btn-tool-select').addEventListener('click', () => {
            this.editor2d.cancelPlacement();
            this.editor2d.setToolMode('select');
        });
        document.getElementById('btn-tool-pan').addEventListener('click', () => this.editor2d.setToolMode('pan'));
        document.getElementById('btn-tool-wall').addEventListener('click', () => {
            this.editor2d.cancelPlacement();
            this.editor2d.setToolMode('wall');
            this.showToast('拖拽绘制内墙/隔断，自动横竖吸附');
        });
        document.getElementById('btn-tool-floor').addEventListener('click', () => {
            this.editor2d.cancelPlacement();
            this.editor2d.setToolMode('material-floor');
            this.showSurfaceModeHint('floor');
            this.showToast('选左下材质，再点画布刷地面');
        });
        document.getElementById('btn-tool-wall-material').addEventListener('click', () => {
            this.editor2d.cancelPlacement();
            this.editor2d.setToolMode('material-wall');
            this.showSurfaceModeHint('wall');
            this.showToast('选左下材质，再点画布刷墙面');
        });
        document.getElementById('btn-delete-wall').addEventListener('click', () => {
            if (this.editor2d.deleteLastWall()) this.showToast('已删除最近绘制的墙体');
        });
        document.querySelectorAll('[data-surface-material]').forEach(button => {
            button.addEventListener('click', () => {
                this.editor2d.setActiveSurfaceMaterial(button.dataset.surfaceMaterial);
                this.updateSurfaceMaterialState();
                if (this.editor2d.mode === 'material-floor' || this.editor2d.mode === 'material-wall') {
                    this.showSurfaceModeHint(this.editor2d.mode === 'material-floor' ? 'floor' : 'wall');
                } else {
                    this.showToast('已选材质，接着点刷地面或刷墙面');
                }
            });
        });
        document.getElementById('btn-grid').addEventListener('click', event => {
            const enabled = !this.editor2d.snapEnabled;
            this.editor2d.setGridEnabled(enabled);
            event.currentTarget.classList.toggle('active', enabled);
            event.currentTarget.setAttribute('aria-pressed', String(enabled));
            this.showToast(enabled ? '已开启 0.05 m 网格吸附' : '已关闭网格吸附');
        });
        this.bindDesignAidToggle('btn-dimensions', 'dimensions', '尺寸标注');
        this.bindDesignAidToggle('btn-guides', 'guides', '智能辅助线');
        this.bindDesignAidToggle('btn-clearance', 'clearance', '净距检查');

        document.querySelectorAll('[data-camera]').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('[data-camera]').forEach(item => item.classList.remove('active'));
                button.classList.add('active');
                this.ensureScene3D().setCameraView(button.dataset.camera);
            });
        });
        document.getElementById('render-quality').addEventListener('change', event => {
            this.ensureScene3D().setRenderQuality(event.currentTarget.value);
            this.showToast(`渲染画质：${event.currentTarget.selectedOptions[0].textContent}`);
        });
        document.getElementById('lighting-preset').addEventListener('change', event => {
            this.ensureScene3D().setLightingPreset(event.currentTarget.value);
            this.showToast(`灯光：${event.currentTarget.selectedOptions[0].textContent}`);
        });
        document.getElementById('btn-bright-surfaces').addEventListener('click', () => this.applyBrightSurfacePreset());
        document.getElementById('btn-reset-camera').addEventListener('click', () => {
            this.ensureScene3D().setCameraView('perspective');
            document.querySelectorAll('[data-camera]').forEach(button => {
                button.classList.toggle('active', button.dataset.camera === 'perspective');
            });
        });

        document.querySelectorAll('[data-showroom-view]').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('[data-showroom-view]').forEach(item => item.classList.remove('active'));
                button.classList.add('active');
                this.ensureScene3D().setShowroomView(button.dataset.showroomView);
            });
        });
        document.querySelector('[data-showroom-exit]').addEventListener('click', () => this.exitShowroom());

        document.getElementById('btn-snap-wall').addEventListener('click', () => {
            this.editor2d.snapToWall(this.editor2d.selectedCabinet);
        });
        document.getElementById('btn-rotate').addEventListener('click', () => {
            this.editor2d.rotateCabinet(this.editor2d.selectedCabinet);
            this.updatePropPanel(this.editor2d.selectedCabinet);
        });
        document.getElementById('btn-duplicate').addEventListener('click', () => {
            const copy = this.editor2d.duplicateCabinet(this.editor2d.selectedCabinet);
            if (copy) this.showToast('已复制模块');
        });
        document.getElementById('btn-delete').addEventListener('click', () => {
            this.editor2d.deleteCabinet(this.editor2d.selectedCabinet);
        });
        document.getElementById('btn-close-prop').addEventListener('click', () => {
            if (this.isCompactDevice() && this.mobileInspectorExplicit && this.editor2d.selectedCabinet) {
                this.mobileInspectorExplicit = false;
                this.showPropPanel(this.editor2d.selectedCabinet);
                return;
            }
            this.editor2d.deselect();
        });

        document.getElementById('btn-mobile-selection-close')?.addEventListener('click', () => this.editor2d.deselect());
        document.getElementById('btn-mobile-properties')?.addEventListener('click', () => {
            if (!this.editor2d.selectedCabinet) return;
            this.mobileInspectorExplicit = true;
            this.showPropPanel(this.editor2d.selectedCabinet);
        });
        document.getElementById('btn-mobile-snap')?.addEventListener('click', () => {
            const cabinet = this.editor2d.selectedCabinet;
            if (!cabinet) return;
            this.editor2d.snapToWall(cabinet);
            this.showToast('已靠到最近墙面');
        });
        document.getElementById('btn-mobile-rotate')?.addEventListener('click', () => {
            const cabinet = this.editor2d.selectedCabinet;
            if (!cabinet) return;
            this.editor2d.rotateCabinet(cabinet);
            this.updatePropPanel(cabinet);
        });
        document.getElementById('btn-mobile-duplicate')?.addEventListener('click', () => {
            const copy = this.editor2d.duplicateCabinet(this.editor2d.selectedCabinet);
            if (copy) this.showToast('已复制模块');
        });
        document.getElementById('btn-mobile-delete')?.addEventListener('click', () => {
            this.editor2d.deleteCabinet(this.editor2d.selectedCabinet);
        });
        document.getElementById('btn-mobile-placement-cancel')?.addEventListener('click', () => {
            if (this.editor2d.cancelPlacement()) this.showToast('已取消放置');
        });

        ['prop-width', 'prop-depth', 'prop-height', 'prop-elevation'].forEach(id => {
            document.getElementById(id).addEventListener('change', event => {
                const cabinet = this.editor2d.selectedCabinet;
                if (!cabinet) return;
                const input = event.currentTarget;
                const minimum = Number(input.min);
                const maximum = Number(input.max);
                const raw = Number.parseFloat(input.value);
                const meters = Math.max(minimum, Math.min(maximum, Number.isFinite(raw) ? raw : minimum));
                const valueMm = this.metersToMm(meters);
                input.value = this.formatMeters(valueMm);
                this.editor2d.updateCabinetProp(cabinet, id.replace('prop-', ''), valueMm);
                this.updatePropPanel(cabinet);
            });
        });

        this.bindColorSwatches('cabinet-colors', 'color');
        this.bindColorSwatches('countertop-colors', 'countertopColor');

        const menuButton = document.getElementById('btn-project-menu');
        const menu = document.getElementById('project-menu');
        menuButton.addEventListener('click', event => {
            event.stopPropagation();
            menu.hidden = !menu.hidden;
            menuButton.setAttribute('aria-expanded', String(!menu.hidden));
        });
        document.addEventListener('click', event => {
            if (!event.target.closest('.menu-wrap')) {
                menu.hidden = true;
                menuButton.setAttribute('aria-expanded', 'false');
            }
        });
        document.getElementById('btn-new').addEventListener('click', () => this.newProject());
        document.getElementById('btn-reference-kitchen').addEventListener('click', () => this.createReferenceKitchenPlan());
        document.getElementById('btn-plan-library').addEventListener('click', () => this.openPlanLibrary());
        document.getElementById('btn-import').addEventListener('click', () => document.getElementById('file-import').click());
        document.getElementById('btn-export-json').addEventListener('click', () => this.exportProject());
        document.getElementById('file-import').addEventListener('change', event => this.importProject(event));
        document.getElementById('btn-plan-library-close').addEventListener('click', () => this.closePlanLibrary());
        document.getElementById('btn-plan-new').addEventListener('click', () => this.newProject());
        document.getElementById('btn-plan-save-as').addEventListener('click', () => this.saveAsPlan());
        document.getElementById('btn-plan-save-current').addEventListener('click', () => {
            if (this.save(false)) this.renderPlanLibrary();
        });
        document.getElementById('plan-library-list').addEventListener('click', event => this.handlePlanLibraryAction(event));
        document.getElementById('plan-library').addEventListener('click', event => {
            if (event.target === event.currentTarget) this.closePlanLibrary();
        });

        document.getElementById('project-name').addEventListener('input', () => this.scheduleAutosave());
        document.addEventListener('keydown', event => this.handleKeyboard(event));
    }

    setupInteractionFx() {
        const canvas = document.getElementById('interaction-fx');
        if (!canvas) return;

        const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        this.interactionFx.canvas = canvas;
        this.interactionFx.context = canvas.getContext('2d');
        this.interactionFx.reduceMotion = Boolean(motionQuery?.matches);

        const resize = () => {
            const pixelRatio = this.visualPixelRatio();
            canvas.width = Math.round(window.innerWidth * pixelRatio);
            canvas.height = Math.round(window.innerHeight * pixelRatio);
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            const context = this.interactionFx.context;
            if (context) context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        };

        resize();
        window.addEventListener('resize', resize);
        motionQuery?.addEventListener?.('change', event => {
            this.interactionFx.reduceMotion = event.matches;
            if (event.matches) this.clearInteractionParticles();
        });

        document.addEventListener('pointerdown', event => {
            const target = event.target.closest?.(
                'button, .module-item, .surface-material-bar button, .color-swatches button, .mini-map-tabs button, .project-name, .toolbar-select'
            );
            if (!target || target.disabled || target.closest('.tutorial-overlay')) return;
            this.playClickFeedback(event, target);
        }, { passive: true });
    }

    setupAmbientParticles() {
        const canvas = document.getElementById('ambient-particles');
        if (!canvas) return;

        const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        this.ambientFx.canvas = canvas;
        this.ambientFx.context = canvas.getContext('2d');
        this.ambientFx.reduceMotion = Boolean(motionQuery?.matches);

        const resize = () => {
            const pixelRatio = this.visualPixelRatio();
            canvas.width = Math.round(window.innerWidth * pixelRatio);
            canvas.height = Math.round(window.innerHeight * pixelRatio);
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            const context = this.ambientFx.context;
            if (context) context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            this.seedAmbientParticles();
        };

        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('pointermove', event => {
            this.ambientFx.pointer.x = event.clientX;
            this.ambientFx.pointer.y = event.clientY;
            this.ambientFx.pointer.active = true;
        }, { passive: true });
        window.addEventListener('pointerleave', () => {
            this.ambientFx.pointer.active = false;
        }, { passive: true });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.ambientFx.frame) {
                cancelAnimationFrame(this.ambientFx.frame);
                this.ambientFx.frame = null;
            } else if (!document.hidden && !this.ambientFx.reduceMotion && !this.ambientFx.frame) {
                this.ambientFx.frame = requestAnimationFrame(() => this.renderAmbientParticles());
            }
        });
        motionQuery?.addEventListener?.('change', event => {
            this.ambientFx.reduceMotion = event.matches;
            if (event.matches && this.ambientFx.frame) {
                cancelAnimationFrame(this.ambientFx.frame);
                this.ambientFx.frame = null;
                this.ambientFx.context?.clearRect(0, 0, window.innerWidth, window.innerHeight);
            } else if (!event.matches) {
                this.seedAmbientParticles();
                this.ambientFx.frame = requestAnimationFrame(() => this.renderAmbientParticles());
            }
        });

        if (!this.ambientFx.reduceMotion) {
            this.ambientFx.frame = requestAnimationFrame(() => this.renderAmbientParticles());
        }
    }

    seedAmbientParticles() {
        if (this.ambientFx.reduceMotion) return;
        const area = window.innerWidth * window.innerHeight;
        const compact = this.isCompactDevice();
        const count = compact
            ? Math.max(16, Math.min(38, Math.round(area / 26000)))
            : Math.max(28, Math.min(84, Math.round(area / 18000)));
        const palette = ['rgba(252,238,9,0.92)', 'rgba(104,243,232,0.72)', 'rgba(255,255,255,0.48)'];
        this.ambientFx.particles = Array.from({ length: count }, (_, index) => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.26,
            vy: -0.08 - Math.random() * 0.22,
            radius: 0.8 + Math.random() * 2.2,
            phase: Math.random() * Math.PI * 2,
            twinkle: 0.36 + Math.random() * 0.7,
            color: palette[index % palette.length]
        }));
    }

    renderAmbientParticles() {
        const { canvas, context, particles, pointer } = this.ambientFx;
        if (!canvas || !context || this.ambientFx.reduceMotion) return;

        const width = window.innerWidth;
        const height = window.innerHeight;
        context.clearRect(0, 0, width, height);

        const pointerPull = pointer.active ? 1 : 0;
        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            particle.phase += 0.018;
            particle.x += particle.vx + Math.sin(particle.phase) * 0.06;
            particle.y += particle.vy;

            if (pointerPull) {
                const dx = pointer.x - particle.x;
                const dy = pointer.y - particle.y;
                const distance = Math.hypot(dx, dy);
                if (distance < 180 && distance > 0.1) {
                    const force = (180 - distance) / 180;
                    particle.x -= dx * force * 0.004;
                    particle.y -= dy * force * 0.004;
                }
            }

            if (particle.y < -16) {
                particle.y = height + 16;
                particle.x = Math.random() * width;
            }
            if (particle.x < -16) particle.x = width + 16;
            if (particle.x > width + 16) particle.x = -16;

            context.globalAlpha = 0.16 + Math.abs(Math.sin(particle.phase)) * particle.twinkle * 0.34;
            context.fillStyle = particle.color;
            context.beginPath();
            context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            context.fill();
        }

        context.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i];
                const b = particles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const distance = Math.hypot(dx, dy);
                if (distance > 118) continue;
                context.globalAlpha = (1 - distance / 118) * 0.07;
                context.strokeStyle = 'rgba(104, 243, 232, 0.8)';
                context.beginPath();
                context.moveTo(a.x, a.y);
                context.lineTo(b.x, b.y);
                context.stroke();
            }
        }
        context.globalAlpha = 1;
        this.ambientFx.frame = requestAnimationFrame(() => this.renderAmbientParticles());
    }

    setupRevealMotion() {
        if (!('IntersectionObserver' in window)) return;
        const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        if (motionQuery?.matches) return;

        this.revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                this.revealObserver.unobserve(entry.target);
            });
        }, {
            rootMargin: '0px 0px -8% 0px',
            threshold: 0.08
        });
    }

    playClickFeedback(event, target) {
        const rect = target.getBoundingClientRect();
        const x = event.clientX || rect.left + rect.width / 2;
        const y = event.clientY || rect.top + rect.height / 2;

        if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) {
            this.spawnRipple(target, x - rect.left, y - rect.top);
        }

        if (this.interactionFx.reduceMotion) return;
        const now = performance.now();
        if (now - this.interactionFx.lastBurstAt < 70) return;
        this.interactionFx.lastBurstAt = now;
        this.spawnInteractionParticles(x, y, target);
    }

    spawnRipple(target, localX, localY) {
        if (!target || target.classList?.contains('no-ripple')) return;
        const rect = target.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.8;
        const ripple = document.createElement('span');
        ripple.className = 'fx-ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = localX - size / 2 + 'px';
        ripple.style.top = localY - size / 2 + 'px';

        target.querySelectorAll?.('.fx-ripple').forEach(item => item.remove());
        target.appendChild(ripple);
        window.setTimeout(() => ripple.remove(), 620);
    }

    spawnInteractionParticles(x, y, target) {
        const context = this.interactionFx.context;
        if (!context) return;

        const accent = getComputedStyle(target).getPropertyValue('--accent').trim() || '#68f3e8';
        const count = target.classList.contains('module-item') ? 18 : 10;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.7 + Math.random() * 2.8;
            this.interactionFx.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.45,
                life: 1,
                decay: 0.024 + Math.random() * 0.022,
                radius: 1.4 + Math.random() * 2.8,
                color: Math.random() > 0.24 ? accent : '#fcee09'
            });
        }

        if (!this.interactionFx.frame) {
            this.interactionFx.frame = requestAnimationFrame(() => this.renderInteractionParticles());
        }
    }

    renderInteractionParticles() {
        const { canvas, context, particles } = this.interactionFx;
        if (!canvas || !context) return;

        context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.035;
            particle.life -= particle.decay;

            if (particle.life <= 0) {
                particles.splice(i, 1);
                continue;
            }

            context.globalAlpha = Math.max(0, particle.life);
            context.fillStyle = particle.color;
            context.beginPath();
            context.arc(particle.x, particle.y, particle.radius * particle.life, 0, Math.PI * 2);
            context.fill();
        }
        context.globalAlpha = 1;

        if (particles.length) {
            this.interactionFx.frame = requestAnimationFrame(() => this.renderInteractionParticles());
        } else {
            this.interactionFx.frame = null;
            context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        }
    }

    clearInteractionParticles() {
        const { context, frame } = this.interactionFx;
        if (frame) cancelAnimationFrame(frame);
        this.interactionFx.frame = null;
        this.interactionFx.particles = [];
        if (context) context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    bindDesignAidToggle(buttonId, type, label) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        button.addEventListener('click', event => {
            const enabled = event.currentTarget.getAttribute('aria-pressed') !== 'true';
            event.currentTarget.classList.toggle('active', enabled);
            event.currentTarget.setAttribute('aria-pressed', String(enabled));
            this.editor2d.setDesignAid(type, enabled);
            this.showToast(`${label}${enabled ? '已开启' : '已关闭'}`);
        });
    }

    updateSurfaceMaterialState() {
        document.querySelectorAll('[data-surface-material]').forEach(button => {
            const active = button.dataset.surfaceMaterial === this.editor2d.activeSurfaceMaterial;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }

    applyBrightSurfacePreset() {
        const next = { wall: 'marble-white', floor: 'stone-grey' };
        const current = this.editor2d.surfaceMaterials;
        const alreadyApplied = current.wall === next.wall && current.floor === next.floor;

        if (!alreadyApplied) {
            this.editor2d.recordHistory();
            this.editor2d.surfaceMaterials = { ...current, ...next };
            this.editor2d.activeSurfaceMaterial = next.wall;
            this.editor2d.emitUpdate();
            this.updateSurfaceMaterialState();
        }

        const scene = this.ensureScene3D();
        scene.setLightingPreset('bright');
        const lightingSelect = document.getElementById('lighting-preset');
        if (lightingSelect) lightingSelect.value = 'bright';
        this.showToast(alreadyApplied ? '当前已是亮白墙地基准' : '已套用亮白墙地基准');
    }

    getActiveSurfaceMaterialName() {
        const active = document.querySelector(`[data-surface-material="${this.editor2d.activeSurfaceMaterial}"] b`);
        return active ? active.textContent.trim() : '当前材质';
    }

    showSurfaceModeHint(target) {
        const hint = document.getElementById('surface-mode-hint');
        if (!hint) return;
        const materialName = this.getActiveSurfaceMaterialName();
        const targetName = target === 'wall' ? '墙面' : '地面';
        hint.hidden = false;
        hint.classList.add('active');
        hint.querySelector('strong').textContent = `刷${targetName}`;
        hint.querySelector('span').textContent = `当前材质：${materialName}。在画布任意位置点一下，会应用到${targetName}${target === 'wall' ? '和所有墙体' : ''}。`;
    }

    hideSurfaceModeHint() {
        const hint = document.getElementById('surface-mode-hint');
        if (!hint) return;
        hint.hidden = true;
        hint.classList.remove('active');
    }

    showRenderOverlay(title, text) {
        const overlay = document.getElementById('render-overlay');
        if (!overlay) return;
        overlay.hidden = false;
        overlay.classList.add('active');
        document.getElementById('render-overlay-title').textContent = title || '生成高清现场图';
        document.getElementById('render-overlay-text').textContent = text || '正在切换高清 PBR 光照与后处理';
    }

    hideRenderOverlay() {
        const overlay = document.getElementById('render-overlay');
        if (!overlay) return;
        overlay.classList.remove('active');
        overlay.hidden = true;
    }

    metersToMm(value) {
        return Math.round((Number(value) || 0) * 1000);
    }

    formatMeters(valueMm, digits = 2) {
        const meters = (Number(valueMm) || 0) / 1000;
        return meters.toFixed(digits).replace(/\.?0+$/, '');
    }

    formatSize(widthMm, depthMm) {
        return `${this.formatMeters(widthMm)} x ${this.formatMeters(depthMm)} m`;
    }

    bindColorSwatches(containerId, property) {
        document.querySelectorAll(`#${containerId} [data-color]`).forEach(button => {
            button.addEventListener('click', () => {
                const cabinet = this.editor2d.selectedCabinet;
                if (!cabinet) return;
                this.editor2d.updateCabinetProp(cabinet, property, button.dataset.color);
                this.updatePropPanel(cabinet);
            });
        });
    }

    handleKeyboard(event) {
        const target = event.target;
        const isEditing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
        const modifier = event.ctrlKey || event.metaKey;

        if (modifier && event.key.toLowerCase() === 's') {
            event.preventDefault();
            this.save(false);
            return;
        }
        if (isEditing) return;
        if (modifier && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            event.shiftKey ? this.editor2d.redo() : this.editor2d.undo();
            return;
        }
        if (modifier && event.key.toLowerCase() === 'y') {
            event.preventDefault();
            this.editor2d.redo();
            return;
        }
        if (event.key === 'Escape') {
            if (this.editor2d.mode !== 'select' && !this.editor2d.pendingModuleId) {
                this.editor2d.setToolMode('select');
                this.hideSurfaceModeHint();
            } else if (!this.editor2d.cancelPlacement()) {
                this.editor2d.deselect();
            }
            return;
        }

        const cabinet = this.editor2d.selectedCabinet;
        if (!cabinet) return;
        const step = event.shiftKey ? 10 : 50;
        const actions = {
            ArrowLeft: () => this.editor2d.nudgeSelected(-step, 0),
            ArrowRight: () => this.editor2d.nudgeSelected(step, 0),
            ArrowUp: () => this.editor2d.nudgeSelected(0, -step),
            ArrowDown: () => this.editor2d.nudgeSelected(0, step)
        };
        if (actions[event.key]) {
            event.preventDefault();
            actions[event.key]();
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
            event.preventDefault();
            this.editor2d.deleteCabinet(cabinet);
        } else if (event.key.toLowerCase() === 'r') {
            event.preventDefault();
            this.editor2d.rotateCabinet(cabinet);
            this.updatePropPanel(cabinet);
        } else if (event.key.toLowerCase() === 'd') {
            event.preventDefault();
            this.editor2d.duplicateCabinet(cabinet);
        }
    }

    switchView(is3D) {
        if (!is3D && this.isShowroomMode) this.exitShowroom(false);
        this.is3DView = is3D;
        const canvas2d = document.getElementById('canvas-2d');
        const canvas3d = document.getElementById('canvas-3d');
        canvas2d.hidden = is3D;
        canvas3d.hidden = !is3D;
        document.getElementById('toolbar-2d').hidden = is3D;
        document.getElementById('toolbar-3d').hidden = !is3D;
        document.getElementById('surface-material-bar').hidden = is3D;
        if (is3D) this.hideSurfaceModeHint();
        document.getElementById('view-mode-label').textContent = is3D ? '空间预览' : '平面布局';

        const button2d = document.getElementById('btn-2d');
        const button3d = document.getElementById('btn-3d');
        const dock2d = document.getElementById('btn-dock-2d');
        const dock3d = document.getElementById('btn-dock-3d');
        button2d.classList.toggle('active', !is3D);
        button3d.classList.toggle('active', is3D);
        dock2d.classList.toggle('active', !is3D);
        dock3d.classList.toggle('active', is3D);
        button2d.setAttribute('aria-selected', String(!is3D));
        button3d.setAttribute('aria-selected', String(is3D));

        if (is3D) {
            const scene = this.ensureScene3D();
            this.sync3D();
            // Sync the current selection into 3D.
            if (this.editor2d.selectedCabinet) {
                scene.selectCabinet3D(this.editor2d.selectedCabinet.id);
            }
            this.resizeAfterLayout(() => scene.resize());
        } else {
            // Clear the 3D highlight when returning to 2D.
            if (this.scene3d) this.scene3d.selectCabinet3D(null);
            this.resizeAfterLayout(() => this.editor2d.resize());
        }
    }

    enterShowroom() {
        this.isShowroomMode = true;
        this.switchView(true);
        document.body.classList.add('showroom-mode');
        document.getElementById('showroom-label').hidden = false;
        document.getElementById('showroom-toolbar').hidden = false;
        document.querySelectorAll('[data-showroom-view]').forEach(button => {
            button.classList.toggle('active', button.dataset.showroomView === 'front');
        });
        const scene = this.ensureScene3D();
        scene.setShowroomMode(true);
        this.resizeAfterLayout(() => scene.resize());
        this.showToast('已进入展厅预览');
    }

    enterClientWalkthrough() {
        if (!this.pathPreview) {
            this.showToast('请先生成高清预览，再开启高清漫游');
            return;
        }
        const enabled = this.pathPreview.enableWalkthrough?.(!this.pathPreview.walkthroughEnabled);
        const button = document.getElementById('btn-path-preview-walk');
        document.getElementById('path-preview')?.classList.toggle('is-walkthrough', Boolean(enabled));
        if (button) {
            button.classList.toggle('active', Boolean(enabled));
            button.setAttribute('aria-pressed', String(Boolean(enabled)));
            button.setAttribute('aria-label', enabled ? '结束高清漫游' : '开启高清漫游');
            button.setAttribute('title', enabled ? '结束高清漫游' : '开启高清漫游');
            const label = button.querySelector('span');
            if (label) label.textContent = enabled ? '结束漫游' : '高清漫游';
        }
        this.showToast(enabled
            ? '高清漫游已开启：拖拽转向，双指或 +/- 缩放'
            : '已结束高清漫游，返回最终成片');
    }

    zoomPathPreview(factor) {
        if (!this.pathPreview?.walkthroughEnabled) {
            this.showToast('请先开启高清漫游');
            return;
        }
        this.pathPreview.zoomBy?.(factor);
    }

    resetPathPreviewView() {
        if (!this.pathPreview?.walkthroughEnabled) {
            this.showToast('请先开启高清漫游');
            return;
        }
        this.pathPreview.resetView?.();
    }

    exitShowroom(switchBack = true) {
        this.isShowroomMode = false;
        document.body.classList.remove('showroom-mode');
        document.getElementById('showroom-label').hidden = true;
        document.getElementById('showroom-toolbar').hidden = true;
        if (this.scene3d) {
            this.scene3d.setShowroomMode(false);
            if (switchBack) this.scene3d.setCameraView('perspective');
            requestAnimationFrame(() => this.scene3d.resize());
        }
    }

    setRoom(showFeedback = true) {
        const widthInput = document.getElementById('room-width');
        const lengthInput = document.getElementById('room-length');
        const ceilingInput = document.getElementById('room-ceiling');
        const width = Number.parseFloat(widthInput.value);
        const length = Number.parseFloat(lengthInput.value);
        if (!Number.isFinite(width) || !Number.isFinite(length) || width < 1 || width > 10 || length < 1 || length > 10) {
            this.showToast('房间尺寸需要在 1 到 10 米之间');
            return false;
        }
        widthInput.value = width.toFixed(1);
        lengthInput.value = length.toFixed(1);
        this.roomHasCeiling = ceilingInput.checked;
        this.editor2d.setRoom(width, length);
        if (this.scene3d) {
            this.scene3d.setRoom(width, length, { hasCeiling: this.roomHasCeiling });
            this.sync3D();
        }
        this.updateDashboard();
        this.scheduleAutosave();
        if (showFeedback) this.showToast(this.roomHasCeiling ? '空间尺寸已更新：带顶' : '空间尺寸已更新：无顶');
        return true;
    }

    renderModuleList() {
        const container = document.getElementById('module-list');
        const source = CABINET_MODULES[this.currentCategory] || [];
        const modules = source.filter(module => module.name.toLowerCase().includes(this.searchQuery));
        const verifiedAssetIds = new Set(
            Object.values(CABINET_MODULES)
                .flatMap(items => items)
                .flatMap(module => (typeof getModelVariants === 'function' ? getModelVariants(module.id) : []))
                .map(variant => variant.id)
        );
        container.innerHTML = '';
        document.getElementById('module-count').textContent = `${modules.length} 组件 · ${verifiedAssetIds.size} 实物`;
        if (this.previewObserver) this.previewObserver.disconnect();
        this.previewObserver = this.createPreviewObserver(container);

        if (!modules.length) {
            container.innerHTML = '<div class="empty-results">没有匹配的模块</div>';
            return;
        }

        const fragment = document.createDocumentFragment();
        modules.forEach((module, index) => {
            const item = document.createElement('div');
            item.className = 'module-item reveal-on-scroll';
            item.tabIndex = 0;
            item.setAttribute('role', 'button');
            item.style.setProperty('--stagger', Math.min(index, 10) * 38 + 'ms');
            item.style.setProperty('--module-color', module.color || '#2f6d58');
            const variants = typeof getModelVariants === 'function' ? getModelVariants(module.id) : [];
            const displayName = this.getModuleDisplayName(module, variants);
            item.setAttribute('aria-label', `放置 ${displayName}`);
            const assetCandidates = Array.isArray(window.MODEL_ASSETS?.[module.id]) ? window.MODEL_ASSETS[module.id] : [];
            const hasPendingRealCandidate = assetCandidates.some(candidate => {
                const review = typeof getAssetReview === 'function' ? getAssetReview(candidate) : null;
                return review?.status === 'hold' || review?.status === 'unreviewed';
            });
            const licenseText = this.getVariantLicenseLabel(variants);
            const sourceBadge = licenseText ? `<strong class="source-badge">${licenseText}</strong>` : '';
            const sourceNote = variants.length
                ? `<span class="module-source-note module-source-note-real">已验收实物模型</span>`
                : module.modelStatus === 'generated'
                    ? `<span class="module-source-note module-source-note-generated">自制概念款 · 非品牌实物</span>`
                : hasPendingRealCandidate
                    ? `<span class="module-source-note">实物候选复核中 · 当前为参数化组件</span>`
                    : `<span class="module-source-note">参数化尺寸组件 · 非品牌实物</span>`;
            const variantOptions = variants.length
                ? `<label class="module-variant">
                        <span>款式</span>
                        <select aria-label="${displayName}款式">
                            ${module.preferParametric ? '<option value="">标准嵌入结构</option>' : ''}
                            ${variants.map(variant => `<option value="${variant.id}">${variant.name}${variant.license ? ` · ${variant.license}` : ''}${variant.ready ? '' : ' · 待导入'}</option>`).join('')}
                        </select>
                    </label>`
                : '';
            item.innerHTML = `
                <div class="module-preview"><canvas width="90" height="58"></canvas></div>
                <div class="module-item-copy">
                    <span class="module-name" title="${displayName}">${displayName}</span>
                    <small>${module.description || '标准模块'}</small>
                    <b class="module-finish">${module.finishName || '标准饰面'}</b>
                    <em>${this.formatSize(module.width, module.depth)}</em>
                    ${sourceNote}
                    ${sourceBadge}
                    ${variantOptions}
                </div>
            `;
            const previewCanvas = item.querySelector('canvas');
            previewCanvas.__module = module;
            const variantSelect = item.querySelector('.module-variant select');
            if (variantSelect) {
                const savedVariant = this.selectedModelVariantByModule[module.id];
                if (savedVariant && variants.some(variant => variant.id === savedVariant)) {
                    variantSelect.value = savedVariant;
                }
                variantSelect.addEventListener('click', event => event.stopPropagation());
                variantSelect.addEventListener('change', event => {
                    this.selectedModelVariantByModule[module.id] = event.currentTarget.value;
                });
            }
            const addModule = () => {
                if (this.is3DView) this.switchView(false);
                const modelVariantId = variantSelect
                    ? variantSelect.value || null
                    : this.selectedModelVariantByModule[module.id] || null;
                this.selectedModelVariantByModule[module.id] = modelVariantId;
                this.editor2d.setPlacementModule(module.id, modelVariantId);
                this.toggleLibraryDrawer(false);
                this.showToast(this.isCompactDevice()
                    ? `在平面图按住拖到位置，松手放置：${displayName}`
                    : `在平面图点击位置放置：${displayName}`);
            };
            item.addEventListener('click', addModule);
            item.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    addModule();
                }
            });
            fragment.appendChild(item);
        });
        container.appendChild(fragment);
        container.querySelectorAll('.module-preview canvas').forEach(canvas => {
            this.queueModuleCardPreview(canvas.__module, canvas);
        });
        container.querySelectorAll('.reveal-on-scroll').forEach(item => {
            if (this.revealObserver) {
                this.revealObserver.observe(item);
            } else {
                item.classList.add('is-visible');
            }
        });
    }

    getVariantLicenseLabel(variants) {
        if (!variants.length) return '';
        if (variants.some(variant => String(variant.license || '').toUpperCase().includes('CC0'))) return 'CC0';
        if (variants.some(variant => String(variant.license || '').toUpperCase().includes('CC BY'))) return 'CC BY·需署名';
        return '外部素材';
    }

    getModuleDisplayName(module, variants = []) {
        if (!module) return '';
        // Imported candidates retain their original catalogue names, but the editor
        // must not present an unapproved candidate as a verified CC0 object.
        return variants.length ? module.name : module.name.replace(/^CC0\s+/, '');
    }

    getCabinetDisplayName(cabinet) {
        const module = typeof findCabinetModule === 'function' ? findCabinetModule(cabinet?.moduleId) : null;
        const variants = module && typeof getModelVariants === 'function' ? getModelVariants(module.id) : [];
        return this.getModuleDisplayName({ name: cabinet?.name || module?.name || '未命名模块' }, variants);
    }

    createPreviewObserver(container) {
        if (!('IntersectionObserver' in window)) return null;
        return new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const canvas = entry.target;
                this.previewObserver.unobserve(canvas);
                this.drawModuleCardPreview(canvas.__module, canvas);
            });
        }, {
            root: container,
            rootMargin: '180px 96px'
        });
    }

    queueModuleCardPreview(module, canvas) {
        if (!canvas) return;
        if (!this.previewObserver) {
            this.drawModuleCardPreview(module, canvas);
            return;
        }
        this.drawPreviewSkeleton(canvas);
        this.previewObserver.observe(canvas);
    }

    drawPreviewSkeleton(canvas) {
        const context = canvas.getContext('2d');
        if (!context) return;
        canvas.classList.remove('is-loaded');
        canvas.setAttribute('aria-busy', 'true');
        canvas.parentElement?.classList.add('is-loading');
        context.clearRect(0, 0, canvas.width, canvas.height);
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#071014');
        gradient.addColorStop(0.5, '#152027');
        gradient.addColorStop(1, '#071014');
        context.fillStyle = gradient;
        context.fillRect(8, 8, canvas.width - 16, canvas.height - 16);
        context.strokeStyle = 'rgba(104, 243, 232, 0.22)';
        context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    }

    drawModuleCardPreview(module, canvas) {
        const context = canvas?.getContext('2d');
        if (!context) return;

        try {
            context.clearRect(0, 0, canvas.width, canvas.height);
            if (typeof module.drawPreview === 'function') {
                module.drawPreview(context, canvas.width, canvas.height);
            } else {
                this.drawFallbackModulePreview(context, module, canvas.width, canvas.height);
            }
            canvas.classList.add('is-loaded');
            canvas.removeAttribute('aria-busy');
            canvas.parentElement?.classList.remove('is-loading');
        } catch (error) {
            console.warn('模块预览绘制失败:', module.id, error);
            this.drawFallbackModulePreview(context, module, canvas.width, canvas.height);
            canvas.classList.add('is-loaded');
            canvas.removeAttribute('aria-busy');
            canvas.parentElement?.classList.remove('is-loading');
        }
    }

    drawFallbackModulePreview(context, module, width, height) {
        const pad = 8;
        context.save();
        context.clearRect(0, 0, width, height);
        context.fillStyle = module.color || '#f5f5f5';
        context.strokeStyle = module.accentColor || '#6f7d83';
        context.lineWidth = 2;
        context.fillRect(pad, pad, width - pad * 2, height - pad * 2);
        context.strokeRect(pad, pad, width - pad * 2, height - pad * 2);
        context.fillStyle = module.countertopColor || 'rgba(255,255,255,0.55)';
        context.fillRect(pad + 3, pad + 3, width - pad * 2 - 6, Math.max(5, height * 0.12));
        context.restore();
    }

    resizeAfterLayout(callback) {
        requestAnimationFrame(() => {
            callback();
            requestAnimationFrame(callback);
            window.setTimeout(callback, 80);
        });
    }

    toggleLibraryDrawer(open = !this.libraryDrawerOpen, { force = false } = {}) {
        const canUseDrawer = this.canUseLibraryDrawer();
        const nextOpen = canUseDrawer && Boolean(open);
        if (!force && this.libraryDrawerOpen === nextOpen) return;
        this.libraryDrawerOpen = nextOpen;
        document.body.classList.toggle('library-drawer-open', nextOpen);
        const panel = document.getElementById('module-panel');
        const button = document.getElementById('btn-library-toggle');
        if (panel) panel.classList.toggle('is-open', nextOpen);
        if (button) {
            button.setAttribute('aria-expanded', String(nextOpen));
            button.setAttribute('title', nextOpen ? '关闭模块库' : '打开模块库');
            button.setAttribute('aria-label', nextOpen ? '关闭模块库' : '打开模块库');
        }
    }

    finishInitialLoad() {
        const loader = document.getElementById('app-loader');
        if (!loader) return;
        requestAnimationFrame(() => {
            loader.classList.add('is-complete');
            window.setTimeout(() => loader.remove(), 280);
        });
    }

    setupTutorial() {
        this.tutorialSteps = [
            {
                kicker: 'STEP 1',
                title: '先定厨房尺寸',
                text: '输入宽度和进深，点击应用尺寸。房间比例会同步到平面图和 3D 空间。'
            },
            {
                kicker: 'STEP 2',
                title: '选择素材后点位摆放',
                text: '在左侧选择地柜、吊柜、电器、卫浴或组合，随后在 2D 平面图里点击准确位置放置。'
            },
            {
                kicker: 'STEP 3',
                title: '拖动、靠墙、旋转',
                text: '选中模块后可拖动、靠墙、旋转、复制和删除。开启网格时会按 0.05 m 对齐。'
            },
            {
                kicker: 'STEP 4',
                title: '修改尺寸和材质',
                text: '选中模块后在右侧按米修改宽深高和离地高度；刷地面/刷墙面时先选左下材质，再点画布应用。'
            },
            {
                kicker: 'STEP 5',
                title: '切到空间预览并导出',
                text: '点击空间查看真实材质、灯光和阴影效果，也可以用现场图生成高清预览。'
            }
        ];

        const progress = document.getElementById('tutorial-progress');
        progress.innerHTML = '';
        this.tutorialSteps.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.addEventListener('click', () => {
                this.tutorialStep = index;
                this.renderTutorial();
            });
            progress.appendChild(dot);
        });

        document.getElementById('btn-tutorial-close').addEventListener('click', () => this.closeTutorial());
        document.getElementById('btn-tutorial-prev').addEventListener('click', () => {
            this.tutorialStep = Math.max(0, this.tutorialStep - 1);
            this.renderTutorial();
        });
        document.getElementById('btn-tutorial-next').addEventListener('click', () => {
            if (this.tutorialStep >= this.tutorialSteps.length - 1) {
                this.closeTutorial();
                return;
            }
            this.tutorialStep += 1;
            this.renderTutorial();
        });
        document.getElementById('tutorial').addEventListener('click', event => {
            if (event.target.id === 'tutorial') this.closeTutorial();
        });
    }

    openTutorial() {
        this.tutorialStep = 0;
        document.getElementById('tutorial').hidden = false;
        this.renderTutorial();
    }

    closeTutorial() {
        document.getElementById('tutorial').hidden = true;
        this.writeLocal(this.tutorialSeenKey, '1');
    }

    renderTutorial() {
        const step = this.tutorialSteps[this.tutorialStep];
        document.getElementById('tutorial-kicker').textContent = step.kicker;
        document.getElementById('tutorial-title').textContent = step.title;
        document.getElementById('tutorial-text').textContent = step.text;
        document.getElementById('btn-tutorial-prev').disabled = this.tutorialStep === 0;
        document.getElementById('btn-tutorial-next').textContent = this.tutorialStep === this.tutorialSteps.length - 1 ? '完成' : '下一步';
        document.querySelectorAll('#tutorial-progress button').forEach((button, index) => {
            button.classList.toggle('active', index === this.tutorialStep);
            button.setAttribute('aria-label', `第 ${index + 1} 步`);
        });
        if (window.lucide) window.lucide.createIcons();
    }

    updateMobileSelectionDock(cabinet, visible = Boolean(cabinet)) {
        const dock = document.getElementById('mobile-selection-dock');
        if (!dock) return;
        dock.hidden = !visible;
        document.body.classList.toggle('has-mobile-selection', visible);
        if (!cabinet || !visible) return;
        const footprint = this.editor2d.getFootprint(cabinet);
        const label = document.getElementById('mobile-selected-label');
        if (label) label.textContent = `${this.getCabinetDisplayName(cabinet)} · ${this.formatSize(footprint.width, footprint.depth)}`;
    }

    showPropPanel(cabinet) {
        const inspector = document.getElementById('prop-panel');
        const overview = document.getElementById('overview-panel');
        const selection = document.getElementById('selection-panel');
        const compact = this.isCompactDevice();
        if (!cabinet) this.mobileInspectorExplicit = false;
        const showMobileDock = compact && Boolean(cabinet) && !this.mobileInspectorExplicit;
        this.updateMobileSelectionDock(cabinet, showMobileDock);

        if (compact && !this.mobileInspectorExplicit) {
            document.querySelector('.workspace')?.classList.remove('is-inspector-open');
            inspector.classList.remove('has-selection');
            overview.hidden = false;
            selection.hidden = true;
            if (cabinet) this.updatePropPanel(cabinet);
            this.updateSelectionMeta();
            return;
        }

        document.querySelector('.workspace')?.classList.toggle('is-inspector-open', Boolean(cabinet));
        inspector.classList.toggle('has-selection', Boolean(cabinet));
        overview.hidden = Boolean(cabinet);
        selection.hidden = !cabinet;
        if (cabinet) this.updatePropPanel(cabinet);
        this.updateSelectionMeta();
    }

    updatePropPanel(cabinet) {
        if (!cabinet) return;
        document.getElementById('selected-name').textContent = this.getCabinetDisplayName(cabinet);
        document.getElementById('prop-width').value = this.formatMeters(cabinet.width);
        document.getElementById('prop-depth').value = this.formatMeters(cabinet.depth);
        document.getElementById('prop-height').value = this.formatMeters(cabinet.height);
        document.getElementById('prop-elevation').value = this.formatMeters(cabinet.elevation);
        this.updateSwatchState('cabinet-colors', cabinet.color);
        this.updateSwatchState('countertop-colors', cabinet.countertopColor || '#f0f0f0');
        const supportsCountertop = cabinet.mountType === 'floor' || cabinet.moduleId.includes('sink') || cabinet.moduleId.includes('island');
        document.querySelector('.countertop-options').hidden = !supportsCountertop;
    }

    updateSwatchState(containerId, color) {
        document.querySelectorAll(`#${containerId} [data-color]`).forEach(button => {
            const active = button.dataset.color.toLowerCase() === String(color).toLowerCase();
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }

    updateSelectionMeta() {
        const cabinet = this.editor2d.selectedCabinet;
        const label = document.getElementById('selection-meta');
        if (!cabinet) {
            label.textContent = `${this.editor2d.cabinets.length} 个模块`;
            return;
        }
        const footprint = this.editor2d.getFootprint(cabinet);
        label.textContent = `${this.getCabinetDisplayName(cabinet)} · ${this.formatSize(footprint.width, footprint.depth)} · 离地 ${this.formatMeters(cabinet.elevation)} m`;
    }

    updateDashboard() {
        const cabinets = this.editor2d.cabinets;
        const collisions = this.editor2d.getCollisions();
        const roomArea = this.editor2d.roomWidth * this.editor2d.roomLength;
        const footprintArea = cabinets.reduce((total, cabinet) => {
            const footprint = this.editor2d.getFootprint(cabinet);
            return total + (footprint.width * footprint.depth) / 1000000;
        }, 0);
        const totalWidth = cabinets.reduce((total, cabinet) => total + cabinet.width / 1000, 0);
        const baseCount = cabinets.filter(cabinet => cabinet.mountType === 'floor' && !cabinet.moduleId.includes('countertop')).length;
        const wallCount = cabinets.filter(cabinet => cabinet.mountType === 'wall').length;
        const outsideCount = cabinets.filter(cabinet => {
            const footprint = this.editor2d.getFootprint(cabinet);
            return cabinet.x < 0 || cabinet.y < 0 || cabinet.x + footprint.width > this.editor2d.roomWidth * 1000 || cabinet.y + footprint.depth > this.editor2d.roomLength * 1000;
        }).length;
        const verticalOutsideCount = cabinets.filter(cabinet => cabinet.elevation < 0 || cabinet.elevation + cabinet.height > 2500).length;

        document.getElementById('stat-count').textContent = cabinets.length;
        document.getElementById('stat-length').textContent = `${totalWidth.toFixed(1)} m`;
        document.getElementById('stat-base').textContent = baseCount;
        document.getElementById('stat-wall').textContent = wallCount;
        document.getElementById('stat-area').textContent = `${roomArea.toFixed(1)} m²`;
        document.getElementById('stat-footprint').textContent = `${footprintArea.toFixed(1)} m²`;
        document.getElementById('stat-collisions').textContent = `${collisions.length} 处`;
        const density = roomArea > 0 ? footprintArea / roomArea : 0;
        const score = Math.max(0, Math.round(100
            - collisions.length * 16
            - outsideCount * 12
            - verticalOutsideCount * 10
            - Math.max(0, density - 0.42) * 80
            - (cabinets.length ? 0 : 8)));
        document.getElementById('stat-score').textContent = score;
        this.updateDesignAdvice({
            cabinets,
            collisions,
            outsideCount,
            verticalOutsideCount,
            density,
            baseCount,
            wallCount
        });

        const health = document.getElementById('design-health');
        const warningBlock = document.getElementById('warning-block');
        const warningText = document.getElementById('warning-text');
        const issueCount = collisions.length + outsideCount + verticalOutsideCount;
        health.textContent = issueCount ? `${issueCount} 项待处理` : '空间正常';
        health.classList.toggle('warning', issueCount > 0);
        warningBlock.hidden = issueCount === 0;
        if (issueCount) {
            const messages = [];
            if (collisions.length) messages.push(`${collisions.length} 处同层模块重叠`);
            if (outsideCount) messages.push(`${outsideCount} 个模块超出房间范围`);
            if (verticalOutsideCount) messages.push(`${verticalOutsideCount} 个模块顶部超过 2.5 m`);
            warningText.textContent = messages.join('；');
        }
        this.updateSelectionMeta();
    }

    updateDesignAdvice({ cabinets, collisions, outsideCount, verticalOutsideCount, density, baseCount, wallCount }) {
        const list = document.getElementById('design-advice-list');
        if (!list) return;
        const advice = [];
        const hasSink = cabinets.some(cabinet => cabinet.hasSink || cabinet.moduleId.includes('sink'));
        const hasCooktop = cabinets.some(cabinet => cabinet.moduleId.includes('cooktop'));
        const hasFridge = cabinets.some(cabinet => cabinet.moduleId.includes('fridge'));

        if (collisions.length) advice.push({ text: `有 ${collisions.length} 处模块重叠，先处理冲突再出图。`, warning: true });
        if (outsideCount) advice.push({ text: `${outsideCount} 个模块超出房间边界，需要靠墙或缩小尺寸。`, warning: true });
        if (verticalOutsideCount) advice.push({ text: `${verticalOutsideCount} 个模块高度超过吊顶，建议调整离地或高度。`, warning: true });
        if (density > 0.42) advice.push({ text: '柜体占地偏高，通道可能不足 0.60 m，建议减少深柜或改 L 型布局。', warning: true });
        if (baseCount && wallCount === 0) advice.push({ text: '已有地柜但没有吊柜，可以补吊柜提升收纳完整度。' });
        if (hasSink && hasCooktop && hasFridge) advice.push({ text: '水槽、灶具、冰箱已形成厨房工作三角，动线基础较完整。' });
        if (hasSink && !hasCooktop) advice.push({ text: '已放水槽，建议补燃气灶/电磁炉完成烹饪区。' });
        if (!cabinets.length) advice.push({ text: '先从左侧选择地柜、卫浴或电器，在平面图点击摆放。' });
        if (!advice.length) advice.push({ text: '空间比例健康，可以切到高清 3D 检查材质和灯光。' });

        list.innerHTML = advice.slice(0, 4)
            .map(item => `<li${item.warning ? ' class="warning"' : ''}>${item.text}</li>`)
            .join('');
    }

    updateHistoryButtons({ canUndo = false, canRedo = false } = {}) {
        document.getElementById('btn-undo').disabled = !canUndo;
        document.getElementById('btn-redo').disabled = !canRedo;
    }

    update2DToolState({ mode = 'select', pendingModuleId = null } = {}) {
        const selectButton = document.getElementById('btn-tool-select');
        const panButton = document.getElementById('btn-tool-pan');
        const wallButton = document.getElementById('btn-tool-wall');
        const floorButton = document.getElementById('btn-tool-floor');
        const wallMaterialButton = document.getElementById('btn-tool-wall-material');
        const placementDock = document.getElementById('mobile-placement-dock');
        const placementLabel = document.getElementById('mobile-placement-label');
        if (placementDock) placementDock.hidden = !pendingModuleId;
        if (placementLabel && pendingModuleId) {
            const module = findCabinetModule(pendingModuleId);
            placementLabel.textContent = `正在放置：${module?.name || '模块'}`;
        }
        if (!selectButton || !panButton) return;
        selectButton.classList.toggle('active', mode === 'select');
        panButton.classList.toggle('active', mode === 'pan');
        if (wallButton) wallButton.classList.toggle('active', mode === 'wall');
        if (floorButton) floorButton.classList.toggle('active', mode === 'material-floor');
        if (wallMaterialButton) wallMaterialButton.classList.toggle('active', mode === 'material-wall');
        selectButton.setAttribute('aria-pressed', String(mode === 'select'));
        panButton.setAttribute('aria-pressed', String(mode === 'pan'));
        if (wallButton) wallButton.setAttribute('aria-pressed', String(mode === 'wall'));
        if (floorButton) floorButton.setAttribute('aria-pressed', String(mode === 'material-floor'));
        if (wallMaterialButton) wallMaterialButton.setAttribute('aria-pressed', String(mode === 'material-wall'));
        if (mode === 'material-floor') {
            this.showSurfaceModeHint('floor');
        } else if (mode === 'material-wall') {
            this.showSurfaceModeHint('wall');
        } else {
            this.hideSurfaceModeHint();
        }

        const modeLabel = document.getElementById('view-mode-label');
        if (!modeLabel || this.is3DView) return;
        if (pendingModuleId) {
            const module = findCabinetModule(pendingModuleId);
            modeLabel.textContent = module ? `放置：${module.name}` : '放置模块';
        } else {
            const labels = {
                select: '平面图纸',
                pan: '拖动画布',
                wall: '绘制墙体',
                'material-floor': '刷地面材质',
                'material-wall': '刷墙面材质'
            };
            modeLabel.textContent = labels[mode] || '平面图纸';
        }
    }

    updateZoomLabel(scale) {
        document.getElementById('zoom-label').textContent = `${Math.round(scale)}%`;
    }

    sync3D() {
        if (!this.scene3d) return;
        const plan = {
            walls: this.editor2d.captureWalls(),
            surfaceMaterials: { ...this.editor2d.surfaceMaterials }
        };
        const signature = JSON.stringify(plan);
        if (signature !== this.lastPlanSignature) {
            this.scene3d.setPlanElements(plan);
            this.lastPlanSignature = signature;
        }
        this.scene3d.updateCabinets(this.editor2d.cabinets);
    }

    getProjectData() {
        return {
            version: 4,
            name: document.getElementById('project-name').value.trim() || '未命名厨房',
            updatedAt: new Date().toISOString(),
            design: {
                ...this.editor2d.getData(),
                roomHasCeiling: this.roomHasCeiling
            }
        };
    }

    readLocal(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (error) {
            console.warn('读取本地存储失败:', error);
            return null;
        }
    }

    writeLocal(key, value) {
        try {
            window.localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.warn('写入本地存储失败:', error);
            return false;
        }
    }

    removeLocal(key) {
        try {
            window.localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn('清理本地存储失败:', error);
            return false;
        }
    }

    consumeResetQuery() {
        const params = new URLSearchParams(window.location.search);
        if (!params.has('reset')) return false;
        this.removeLocal(this.storageKey);
        this.removeLocal('kitchen-design');
        this.planRepository.setActive(null);
        this.activePlanId = null;
        this.selectedModelVariantByModule = {};
        if (window.history?.replaceState) {
            const cleanUrl = window.location.pathname + window.location.hash;
            window.history.replaceState(null, document.title, cleanUrl);
        }
        return true;
    }

    scheduleAutosave() {
        const state = document.getElementById('save-state');
        const label = document.getElementById('save-state-text');
        state.classList.add('saving');
        label.textContent = '保存中';
        window.clearTimeout(this.autosaveTimer);
        this.autosaveTimer = window.setTimeout(() => this.save(true), 500);
    }

    save(silent = false, { createNew = false, name = null } = {}) {
        window.clearTimeout(this.autosaveTimer);
        try {
            if (name) document.getElementById('project-name').value = name;
            const projectData = this.getProjectData();
            const record = !createNew && this.activePlanId
                ? this.planRepository.save(this.activePlanId, projectData)
                : this.planRepository.create(projectData);
            if (!record || !this.planRepository.setActive(record.id)) {
                throw new Error('localStorage unavailable');
            }
            this.activePlanId = record.id;
            // Keep the previous single-project key current so older app installs can still recover it.
            this.writeLocal(this.storageKey, JSON.stringify(record));
            const state = document.getElementById('save-state');
            state.classList.remove('saving');
            document.getElementById('save-state-text').textContent = '已保存';
            if (!silent) this.showToast(createNew ? '已另存为新方案' : '方案已保存到本地');
            if (!document.getElementById('plan-library').hidden) this.renderPlanLibrary();
            return record;
        } catch (e) {
            console.warn('保存失败:', e);
            if (!silent) this.showToast('保存失败：本地存储空间可能已满');
            return null;
        }
    }

    loadSavedProject() {
        let parsed = this.planRepository.get(this.planRepository.getActiveId());
        if (parsed) this.activePlanId = parsed.id;
        if (!parsed && this.planRepository.list().length === 0) {
            const raw = this.readLocal(this.storageKey) || this.readLocal('kitchen-design');
            if (raw) {
                try {
                    const legacy = JSON.parse(raw);
                    parsed = this.planRepository.create(legacy);
                    if (parsed && this.planRepository.setActive(parsed.id)) this.activePlanId = parsed.id;
                } catch (error) {
                    console.warn('迁移旧方案失败:', error);
                }
            }
        }
        if (!parsed) return false;
        try {
            const design = parsed.design || parsed;
            const sanitized = this.sanitizePersistedDesign(design);
            this.applyProjectData(parsed);
            if (sanitized) this.save(true);
            return true;
        } catch (error) {
            console.warn('读取本地方案失败:', error);
            return false;
        }
    }

    applyProjectData(projectData) {
        const design = projectData.design || projectData;
        this.editor2d.loadData(design);
        document.getElementById('project-name').value = projectData.name || '未命名厨房';
        document.getElementById('room-width').value = Number(design.roomWidth || 2.5).toFixed(1);
        document.getElementById('room-length').value = Number(design.roomLength || 3).toFixed(1);
        this.roomHasCeiling = design.roomHasCeiling !== false;
        document.getElementById('room-ceiling').checked = this.roomHasCeiling;
        if (this.scene3d) {
            this.scene3d.setRoom(design.roomWidth, design.roomLength, { hasCeiling: this.roomHasCeiling });
            this.scene3d.setReferenceKitchenStage(projectData.name === '亮白实景样板');
            this.sync3D();
        }
        this.updateDashboard();
        this.updateZoomLabel(this.editor2d.scale);
    }

    sanitizePersistedDesign(design) {
        if (!design || !Array.isArray(design.cabinets)) return false;
        let changed = false;
        design.cabinets.forEach(cabinet => {
            if (!cabinet || !cabinet.modelVariantId) return;
            const variants = typeof getModelVariants === 'function' ? getModelVariants(cabinet.moduleId || cabinet.id) : [];
            const isAllowed = variants.some(variant => variant.id === cabinet.modelVariantId);
            if (!isAllowed) {
                cabinet.modelVariantId = null;
                changed = true;
            }
        });
        return changed;
    }

    newProject() {
        if ((this.editor2d.cabinets.length || this.editor2d.walls.length) && !window.confirm('新建方案会清空当前布局，是否继续？')) return;
        const design = {
            roomWidth: 2.5,
            roomLength: 3,
            roomHasCeiling: true,
            cabinets: [],
            walls: [],
            surfaceMaterials: { floor: 'marble-white', wall: 'marble-white' }
        };
        this.editor2d.loadData(design);
        this.roomHasCeiling = true;
        document.getElementById('project-name').value = '未命名厨房';
        document.getElementById('room-width').value = '2.5';
        document.getElementById('room-length').value = '3.0';
        document.getElementById('room-ceiling').checked = true;
        if (this.scene3d) {
            this.scene3d.setRoom(2.5, 3, { hasCeiling: true });
            this.scene3d.setReferenceKitchenStage(false);
            this.sync3D();
        }
        this.updateDashboard();
        this.activePlanId = null;
        this.planRepository.setActive(null);
        this.save(true, { createNew: true });
        this.closePlanLibrary();
        document.getElementById('project-menu').hidden = true;
        this.showToast('已创建空白方案');
    }

    createReferenceKitchenPlan() {
        const templateName = '亮白实景样板';
        const existingTemplate = this.planRepository.list().find(plan => plan.name === templateName);
        const place = (moduleId, x, y, modelVariantId = null, overrides = {}) => {
            const cabinet = createCabinetInstance(moduleId, x, y, modelVariantId);
            return cabinet ? { ...cabinet, ...overrides } : null;
        };
        const cabinets = [
            place('base-sink', 0, 0),
            place('base-drawer', 800, 0),
            place('base-double', 1400, 0),
            place('base-drawer-three', 2000, 0),
            place('fridge', 3400, 0),
            place('base-double', 0, 650, null, { rotation: 90 }),
            place('base-drawer', 0, 1250, null, { rotation: 90 }),
            place('base-drawer', 3420, 650, null, { rotation: 90 }),
            place('base-double', 3420, 1250, null, { rotation: 90 }),
            place('sink-double', 20, 60),
            place('cooktop-premium', 1600, 65),
            place('range-hood-side', 1530, 45),
            // Keep the hood clear of the wall-cabinet collision layer while
            // retaining a balanced run of upper storage on both sides.
            place('wall-double', 600, 0),
            place('wall-single', 2600, 0),
            place('wall-single', 3150, 0),
            place('decor-plant-succulent', 2960, 90, 'ph-potted-plant-04'),
            place('decor-cutting-board', 2500, 115, 'ph-cutting-board')
        ].filter(Boolean);

        const design = {
            roomWidth: 4,
            roomLength: 3.4,
            roomHasCeiling: true,
            cabinets,
            walls: [],
            surfaceMaterials: { floor: 'stone-grey', wall: 'marble-white' }
        };

        this.editor2d.loadData(design);
        this.roomHasCeiling = true;
        document.getElementById('project-name').value = templateName;
        document.getElementById('room-width').value = '4.0';
        document.getElementById('room-length').value = '3.4';
        document.getElementById('room-ceiling').checked = true;
        this.activePlanId = existingTemplate?.id || null;
        this.planRepository.setActive(this.activePlanId);
        this.save(true, { createNew: !existingTemplate, name: templateName });
        const scene = this.ensureScene3D();
        scene.setRoom(4, 3.4, { hasCeiling: true });
        scene.setReferenceKitchenStage(true);
        scene.setLightingPreset('bright');
        this.sync3D();
        this.updateDashboard();
        this.switchView(true);
        this.resizeAfterLayout(() => scene.setReferenceKitchenCamera());
        document.getElementById('project-menu').hidden = true;
        document.getElementById('btn-project-menu').setAttribute('aria-expanded', 'false');
        this.showToast(existingTemplate ? '已更新归档亮白实景样板' : '已创建并归档亮白实景样板');
    }

    async exportProject() {
        const blob = new Blob([JSON.stringify(this.getProjectData(), null, 2)], { type: 'application/json' });
        await this.downloadBlob(blob, `${this.safeProjectName()}.json`);
        document.getElementById('project-menu').hidden = true;
    }

    async importProject(event) {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) return;
        try {
            const parsed = JSON.parse(await file.text());
            const imported = { ...parsed, name: parsed.name || file.name.replace(/\.json$/i, '') };
            this.applyProjectData(imported);
            this.activePlanId = null;
            this.planRepository.setActive(null);
            this.save(true, { createNew: true });
            this.showToast('方案已导入');
        } catch (error) {
            console.warn('导入方案失败:', error);
            this.showToast('无法导入：方案文件格式不正确');
        }
    }

    openPlanLibrary() {
        this.renderPlanLibrary();
        document.getElementById('plan-library').hidden = false;
        document.getElementById('project-menu').hidden = true;
        document.getElementById('btn-project-menu').setAttribute('aria-expanded', 'false');
    }

    closePlanLibrary() {
        document.getElementById('plan-library').hidden = true;
    }

    renderPlanLibrary() {
        const list = document.getElementById('plan-library-list');
        const plans = this.planRepository.list();
        const escape = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
        if (!plans.length) {
            list.innerHTML = '<div class="plan-library-empty">还没有归档方案</div>';
            return;
        }
        list.innerHTML = plans.map(plan => {
            const isCurrent = plan.id === this.activePlanId;
            const dimensions = plan.roomWidth && plan.roomLength
                ? `${plan.roomWidth.toFixed(1)} x ${plan.roomLength.toFixed(1)} m`
                : '未设置尺寸';
            const updatedAt = Number.isNaN(Date.parse(plan.updatedAt))
                ? '未知时间'
                : new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(plan.updatedAt));
            return `<article class="plan-library-item${isCurrent ? ' is-current' : ''}">
                <div class="plan-library-copy">
                    <strong>${escape(plan.name)}</strong>
                    <span>${dimensions} · ${Number(plan.moduleCount) || 0} 个模块</span>
                    <time>${updatedAt}</time>
                </div>
                <div class="plan-library-actions">
                    <button class="secondary-btn plan-open-btn" type="button" data-plan-action="open" data-plan-id="${escape(plan.id)}">${isCurrent ? '继续编辑' : '打开'}</button>
                    <button class="icon-btn plan-export-btn" type="button" data-plan-action="export" data-plan-id="${escape(plan.id)}" title="导出方案" aria-label="导出方案"><i data-lucide="download"></i></button>
                    <button class="icon-btn plan-delete-btn" type="button" data-plan-action="delete" data-plan-id="${escape(plan.id)}" title="删除方案"><i data-lucide="trash-2"></i></button>
                </div>
            </article>`;
        }).join('');
        if (window.lucide) window.lucide.createIcons();
    }

    handlePlanLibraryAction(event) {
        const button = event.target.closest('[data-plan-action]');
        if (!button) return;
        const { planAction, planId } = button.dataset;
        if (planAction === 'open') this.openArchivedPlan(planId);
        if (planAction === 'export') this.exportArchivedPlan(planId);
        if (planAction === 'delete') this.deleteArchivedPlan(planId);
    }

    openArchivedPlan(id) {
        const record = this.planRepository.get(id);
        if (!record) {
            this.showToast('该方案已不存在');
            this.renderPlanLibrary();
            return;
        }
        this.save(true);
        this.activePlanId = id;
        this.planRepository.setActive(id);
        this.applyProjectData(record);
        this.writeLocal(this.storageKey, JSON.stringify(record));
        this.closePlanLibrary();
        this.showToast('已打开归档方案');
    }

    deleteArchivedPlan(id) {
        const plan = this.planRepository.list().find(item => item.id === id);
        if (!plan) return;
        if (!window.confirm(`删除“${plan.name}”？此操作无法恢复。`)) return;
        const wasActive = id === this.activePlanId;
        if (!this.planRepository.delete(id)) {
            this.showToast('删除失败，请检查本地存储');
            return;
        }
        if (wasActive) {
            this.activePlanId = null;
            document.getElementById('save-state-text').textContent = '未归档';
        }
        this.renderPlanLibrary();
        this.showToast('方案已删除');
    }

    async exportArchivedPlan(id) {
        const record = this.planRepository.get(id);
        if (!record) {
            this.showToast('该方案已不存在');
            this.renderPlanLibrary();
            return;
        }
        const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
        await this.downloadBlob(blob, `${String(record.name || '厨卫方案').replace(/[\\/:*?"<>|]/g, '-')}.json`, '方案');
    }

    saveAsPlan() {
        const input = document.getElementById('plan-copy-name');
        const name = input.value.trim();
        if (!name) {
            input.focus();
            this.showToast('请输入方案名称');
            return;
        }
        const saved = this.save(false, { createNew: true, name });
        if (saved) {
            input.value = '';
            this.renderPlanLibrary();
        }
    }

    async exportImage() {
        try {
            const activePathPreview = document.getElementById('path-preview');
            if (this.pathPreview && activePathPreview && !activePathPreview.hidden) {
                await this.savePathTracingPreview();
                return;
            }
            const dataUrl = this.is3DView ? this.ensureScene3D().takeScreenshot() : this.editor2d.canvas.toDataURL('image/png');
            const filename = `${this.safeProjectName()}-${this.is3DView ? '空间' : '平面'}.png`;
            const blob = await (await fetch(dataUrl)).blob();
            await this.downloadBlob(blob, filename, '图片');
        } catch (error) {
            console.warn('导出图片失败:', error);
            // 最终降级：在新窗口打开图片。
            try {
                const dataUrl = this.is3DView ? this.ensureScene3D().takeScreenshot() : this.editor2d.canvas.toDataURL('image/png');
                const win = window.open();
                if (win) {
                    win.document.write(`<img src="${dataUrl}" style="max-width:100%">`);
                    win.document.title = '导出图片 - 长按保存';
                }
                this.showToast('请长按图片保存');
            } catch (e) {
                this.showToast('导出失败');
            }
        }
    }

    async exportCurrentSceneImage() {
        try {
            const scene = this.ensureScene3D();
            const dataUrl = scene.takeScreenshot();
            const blob = await (await fetch(dataUrl)).blob();
            await this.downloadBlob(blob, `${this.safeProjectName()}-当前空间图.png`, '图片');
            this.showToast('已导出当前空间图');
        } catch (error) {
            console.warn('导出当前空间图失败:', error);
            this.showToast('当前空间图导出失败');
        }
    }

    async openPathTracingPreview() {
        const button = document.getElementById('btn-preview-render');
        const qualitySelect = document.getElementById('render-quality');
        const lightingSelect = document.getElementById('lighting-preset');
        let scene = null;
        let previousQuality = qualitySelect?.value || 'balanced';
        let previousLighting = lightingSelect?.value || 'natural';

        try {
            if (button) button.disabled = true;
            this.showRenderOverlay('高清预览', '正在准备 PBR 场景快照');
            if (!this.is3DView) {
                this.switchView(true);
                await new Promise(resolve => setTimeout(resolve, 180));
            }

            scene = this.ensureScene3D();
            previousQuality = scene.renderQuality || previousQuality;
            previousLighting = scene.lightingPreset || previousLighting;
            scene.setRenderQuality('render');
            scene.setLightingPreset('showroom');
            if (qualitySelect) qualitySelect.value = 'render';
            if (lightingSelect) lightingSelect.value = 'showroom';
            this.sync3D();

            if (typeof scene.waitForAssetsIdle === 'function') {
                this.showRenderOverlay('高清预览', '正在等待模型和材质稳定');
                await scene.waitForAssetsIdle(4500);
            }
            if (typeof scene.waitForNextFrames === 'function') {
                await scene.waitForNextFrames(3);
            }

            this.showRenderOverlay('高清预览', '正在懒加载光追引擎');
            await this.loadPathTracerPreviewBundle();
            const hasPathTracer = Boolean(window.PathTracerPreview?.isSupported?.());
            if (!hasPathTracer || typeof scene.createPathTracingSnapshot !== 'function') {
                this.showToast('当前浏览器不支持光追预览，改用 WebGL 现场图');
                await this.exportPreviewImage();
                return;
            }

            const snapshot = scene.createPathTracingSnapshot();
            if (!snapshot.meshes?.length) throw new Error('没有可用于高清预览的场景几何');
            const compactPreview = this.isCompactDevice();
            const previewProfile = compactPreview
                ? { samples: 96, bounces: 5, renderScale: 0.72, outputWidth: 960, textureSize: 1024, transmissiveBounces: 2 }
                : { samples: 1024, bounces: 8, renderScale: 1, outputWidth: 1280, textureSize: 2048, transmissiveBounces: 4 };
            this.showPathPreview();
            this.updatePathPreviewStatus({ state: 'building', samples: 0, maxSamples: previewProfile.samples, progress: 0 });
            const canvas = document.getElementById('path-preview-canvas');
            this.pathPreview?.dispose?.();
            this.pathPreview = new window.PathTracerPreview({
                canvas,
                onUpdate: status => this.updatePathPreviewStatus(status)
            });
            this.hideRenderOverlay();
            await this.pathPreview.render(snapshot, previewProfile);
        } catch (error) {
            console.warn('光追预览失败，回退 WebGL 现场图:', error);
            this.hideRenderOverlay();
            this.showToast('光追预览失败，正在改用 WebGL 现场图');
            await this.exportPreviewImage();
        } finally {
            if (scene) {
                scene.setRenderQuality(previousQuality);
                scene.setLightingPreset(previousLighting);
            }
            if (qualitySelect) qualitySelect.value = previousQuality;
            if (lightingSelect) lightingSelect.value = previousLighting;
            if (button) button.disabled = false;
            this.hideRenderOverlay();
        }
    }

    loadPathTracerPreviewBundle() {
        if (window.PathTracerPreview) return Promise.resolve();
        if (this.pathPreviewScriptPromise) return this.pathPreviewScriptPromise;
        this.pathPreviewScriptPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-pathtracer-preview]');
            if (existing) {
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => reject(new Error('光追引擎加载失败')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = 'js/vendor/pathtracer-preview.bundle.js?v=20260801-mobile-walk-zoom-v1';
            script.defer = true;
            script.dataset.pathtracerPreview = 'true';
            script.addEventListener('load', () => resolve(), { once: true });
            script.addEventListener('error', () => reject(new Error('光追引擎加载失败')), { once: true });
            document.head.appendChild(script);
        });
        return this.pathPreviewScriptPromise;
    }

    showPathPreview() {
        this.resetPathPreviewWalkthrough();
        const overlay = document.getElementById('path-preview');
        if (!overlay) return;
        const zoomLabel = document.getElementById('path-preview-zoom-label');
        if (zoomLabel) zoomLabel.textContent = '100%';
        overlay.hidden = false;
        overlay.classList.add('active');
        if (window.lucide) window.lucide.createIcons();
    }

    closePathTracingPreview() {
        this.resetPathPreviewWalkthrough();
        this.pathPreview?.stop?.();
        const overlay = document.getElementById('path-preview');
        if (!overlay) return;
        overlay.classList.remove('active');
        overlay.hidden = true;
    }

    resetPathPreviewWalkthrough() {
        this.pathPreview?.enableWalkthrough?.(false);
        document.getElementById('path-preview')?.classList.remove('is-walkthrough');
        const walkButton = document.getElementById('btn-path-preview-walk');
        if (walkButton) {
            walkButton.classList.remove('active');
            walkButton.setAttribute('aria-pressed', 'false');
            walkButton.setAttribute('aria-label', '开启高清漫游');
            walkButton.setAttribute('title', '开启高清漫游');
            const label = walkButton.querySelector('span');
            if (label) label.textContent = '高清漫游';
        }
    }

    updatePathPreviewStatus({ state = 'building', samples = 0, maxSamples = 1024, progress = 0, zoom = null } = {}) {
        const label = document.getElementById('path-preview-status');
        const note = document.getElementById('path-preview-note');
        const zoomLabel = document.getElementById('path-preview-zoom-label');
        if (zoomLabel && Number.isFinite(zoom)) zoomLabel.textContent = `${Math.round(zoom)}%`;
        if (!label) return;
        const shownSamples = Number.isInteger(samples) ? samples : samples.toFixed(1);
        if (state === 'building') {
            label.textContent = progress ? '构建 ' + progress + '%' : '构建中';
            if (note) note.textContent = '正在生成 BVH 与材质缓存';
        } else if (state === 'compiling') {
            label.textContent = progress ? '编译 ' + progress + '%' : '编译中';
            if (note) note.textContent = '正在准备光追着色器';
        } else if (state === 'walkthrough') {
            label.textContent = '漫游预览';
            if (note) note.textContent = '实时漫游：拖拽转方向，双指或 +/- 缩放；返回成片可继续保存最终渲染';
        } else if (state === 'stable') {
            label.textContent = '现场成片';
            if (note) note.textContent = `${maxSamples} samples 已收敛；此图按当前设备优化分辨率保存，高清漫游为实时预览`;
        } else if (state === 'done') {
            label.textContent = shownSamples + '/' + maxSamples + ' samples';
            if (note) note.textContent = '采样完成，正在生成原始分辨率成片';
        } else {
            label.textContent = shownSamples + '/' + maxSamples + ' samples';
            if (note) note.textContent = '正在收敛成片，采样越多噪点越少';
        }
    }

    async savePathTracingPreview() {
        try {
            if (!this.pathPreview) {
                this.showToast('高清预览还没有生成');
                return;
            }
            const raster = document.getElementById('path-preview-raster');
            const dataUrl = raster && !raster.hidden && raster.src
                ? raster.src
                : this.pathPreview.toDataURL();
            const blob = await (await fetch(dataUrl)).blob();
            await this.downloadBlob(blob, this.safeProjectName() + '-光追预览.png', '图片');
            this.showToast('已导出高清光追预览图');
        } catch (error) {
            console.warn('保存光追预览失败:', error);
            this.showToast('保存光追预览失败');
        }
    }

    async exportPreviewImage() {
        const button = document.getElementById('btn-preview-render');
        const qualitySelect = document.getElementById('render-quality');
        const lightingSelect = document.getElementById('lighting-preset');
        let scene = null;
        let previousQuality = qualitySelect?.value || 'balanced';
        let previousLighting = lightingSelect?.value || 'natural';
        try {
            if (button) button.disabled = true;
            this.showRenderOverlay('生成高清现场图', '正在切换空间视图和高质量渲染');
            if (!this.is3DView) {
                this.switchView(true);
                await new Promise(resolve => setTimeout(resolve, 180));
            }
            scene = this.ensureScene3D();
            previousQuality = scene.renderQuality || previousQuality;
            previousLighting = scene.lightingPreset || previousLighting;
            this.showRenderOverlay('生成高清现场图', '正在等待模型与材质加载完成');
            if (typeof scene.waitForAssetsIdle === 'function') {
                await scene.waitForAssetsIdle(4500);
            }
            this.showRenderOverlay('生成高清现场图', '正在启用展厅光、阴影和后处理');
            scene.setRenderQuality('render');
            scene.setLightingPreset('showroom');
            if (qualitySelect) qualitySelect.value = 'render';
            if (lightingSelect) lightingSelect.value = 'showroom';
            if (typeof scene.waitForNextFrames === 'function') {
                await scene.waitForNextFrames(3);
            }
            const dataUrl = scene.takePreviewScreenshot();
            const filename = `${this.safeProjectName()}-现场图.png`;
            const blob = await (await fetch(dataUrl)).blob();
            await this.downloadBlob(blob, filename, '图片');
        } catch (error) {
            console.warn('现场图导出失败', error);
            this.showToast('现场图导出失败');
        } finally {
            if (scene) {
                scene.setRenderQuality(previousQuality);
                scene.setLightingPreset(previousLighting);
            }
            if (qualitySelect) qualitySelect.value = previousQuality;
            if (lightingSelect) lightingSelect.value = previousLighting;
            if (button) button.disabled = false;
            this.hideRenderOverlay();
        }
    }

    getAppUpdaterPlugin() {
        const capacitor = window.Capacitor;
        if (!capacitor || typeof capacitor.isNativePlatform !== 'function' || !capacitor.isNativePlatform()) {
            return null;
        }
        const updater = capacitor.Plugins && capacitor.Plugins.AppUpdater;
        return updater && typeof updater.checkForUpdate === 'function' ? updater : null;
    }

    isNativeApp() {
        const capacitor = window.Capacitor;
        return Boolean(capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform());
    }

    async clearNativePwaCache() {
        if (!this.isNativeApp()) return;

        // Native builds bundle their own web files. Remove leftovers from an older PWA
        // registration without touching localStorage, where the user's plans live.
        try {
            const tasks = [];
            if ('serviceWorker' in navigator && typeof navigator.serviceWorker.getRegistrations === 'function') {
                tasks.push(navigator.serviceWorker.getRegistrations().then(registrations =>
                    Promise.all(registrations.map(registration => registration.unregister()))
                ));
            }
            if ('caches' in window && typeof window.caches.keys === 'function') {
                tasks.push(window.caches.keys().then(keys => Promise.all(keys.map(key => window.caches.delete(key)))));
            }
            await Promise.all(tasks);
        } catch (error) {
            console.warn('清理原生端旧网页缓存失败', error);
        }
    }

    scheduleAutomaticAppUpdateCheck() {
        const updater = this.getAppUpdaterPlugin();
        if (!updater || this.appUpdate.automaticCheckTimer || this.appUpdate.checkPromise) return;

        this.appUpdate.automaticCheckTimer = window.setTimeout(async () => {
            this.appUpdate.automaticCheckTimer = null;
            await this.checkAppUpdate(updater);
            if (['available', 'pending', 'downloading', 'downloaded'].includes(this.appUpdate.phase)) {
                document.getElementById('app-update').hidden = false;
            }
        }, 1000);
    }

    async openAppUpdate() {
        const updater = this.getAppUpdaterPlugin();
        if (!updater) {
            this.showToast('应用内更新仅在安卓 App 中可用');
            return;
        }
        document.getElementById('project-menu').hidden = true;
        document.getElementById('btn-project-menu').setAttribute('aria-expanded', 'false');
        document.getElementById('app-update').hidden = false;
        this.appUpdate.phase = 'checking';
        this.appUpdate.message = '正在检查 GitHub 上的最新版本...';
        this.appUpdate.progress = null;
        this.renderAppUpdate();
        await this.checkAppUpdate(updater);
    }

    closeAppUpdate() {
        this.stopAppUpdatePolling();
        const dialog = document.getElementById('app-update');
        if (dialog) dialog.hidden = true;
    }

    checkAppUpdate(updater = this.getAppUpdaterPlugin()) {
        if (!updater) return Promise.resolve();
        if (this.appUpdate.checkPromise) return this.appUpdate.checkPromise;

        this.stopAppUpdatePolling();
        this.appUpdate.phase = 'checking';
        this.appUpdate.message = '正在检查 GitHub 上的最新版本...';
        this.appUpdate.progress = null;
        this.renderAppUpdate();

        const request = (async () => {
            try {
                const release = await updater.checkForUpdate();
                this.appUpdate.release = release;
                this.appUpdate.downloadId = null;
                if (!release.updateAvailable) {
                    this.appUpdate.phase = 'current';
                    this.appUpdate.message = '已是最新版本';
                    this.renderAppUpdate();
                    return;
                }

                const status = await updater.getDownloadStatus();
                const matchingDownload = status && status.assetUrl && status.assetUrl === release.assetUrl;
                if (matchingDownload && ['pending', 'paused', 'downloading', 'downloaded'].includes(status.status)) {
                    this.applyAppUpdateDownloadStatus(status);
                    return;
                }
                this.appUpdate.phase = 'available';
                this.appUpdate.message = `发现 ${release.latestVersion}，可在 App 内直接下载并安装`;
                this.renderAppUpdate();
            } catch (error) {
                console.warn('应用更新检查失败', error);
                this.appUpdate.phase = 'error';
                this.appUpdate.message = error?.message || '检查更新失败，请稍后重试';
                this.renderAppUpdate();
            }
        })();

        this.appUpdate.checkPromise = request;
        return request.finally(() => {
            if (this.appUpdate.checkPromise === request) this.appUpdate.checkPromise = null;
        });
    }

    async handleAppUpdateAction() {
        if (this.appUpdate.phase === 'checking' || this.appUpdate.phase === 'downloading' || this.appUpdate.phase === 'pending') {
            return;
        }
        if (this.appUpdate.phase === 'current') {
            this.closeAppUpdate();
            return;
        }
        if (this.appUpdate.phase === 'downloaded') {
            await this.installAppUpdate();
            return;
        }
        if (this.appUpdate.phase === 'error' || !this.appUpdate.release) {
            await this.checkAppUpdate();
            return;
        }
        await this.downloadAppUpdate();
    }

    async downloadAppUpdate() {
        const updater = this.getAppUpdaterPlugin();
        const release = this.appUpdate.release;
        if (!updater || !release) return;
        try {
            this.appUpdate.phase = 'starting-download';
            this.appUpdate.message = '正在交给系统下载管理器...';
            this.renderAppUpdate();
            const result = await updater.downloadUpdate({
                assetUrl: release.assetUrl,
                assetName: release.assetName,
                latestVersion: release.latestVersion
            });
            if (result?.permissionRequired) {
                this.appUpdate.phase = 'permission';
                this.appUpdate.message = '已打开系统设置。请允许此 App 安装未知应用，返回后再次点击下载。';
                this.renderAppUpdate();
                return;
            }
            this.appUpdate.downloadId = result.downloadId;
            this.appUpdate.phase = 'downloading';
            this.appUpdate.message = '正在下载更新包...';
            this.appUpdate.progress = { downloadedBytes: 0, totalBytes: Number(release.assetSize || 0) };
            this.renderAppUpdate();
            this.pollAppUpdateDownload();
        } catch (error) {
            console.warn('应用更新下载失败', error);
            this.appUpdate.phase = 'failed';
            this.appUpdate.message = error?.message || '无法开始下载，请重试';
            this.renderAppUpdate();
        }
    }

    async pollAppUpdateDownload() {
        this.stopAppUpdatePolling();
        const updater = this.getAppUpdaterPlugin();
        if (!updater || !this.appUpdate.downloadId) return;
        try {
            const status = await updater.getDownloadStatus({ downloadId: this.appUpdate.downloadId });
            this.applyAppUpdateDownloadStatus(status);
            if (['pending', 'paused', 'downloading'].includes(status?.status)) {
                this.appUpdate.pollTimer = window.setTimeout(() => this.pollAppUpdateDownload(), 750);
            }
        } catch (error) {
            console.warn('读取更新下载状态失败', error);
            this.appUpdate.phase = 'failed';
            this.appUpdate.message = error?.message || '下载状态读取失败，请重新下载';
            this.renderAppUpdate();
        }
    }

    applyAppUpdateDownloadStatus(status) {
        if (!status) return;
        this.appUpdate.downloadId = status.downloadId || this.appUpdate.downloadId;
        this.appUpdate.progress = {
            downloadedBytes: Number(status.downloadedBytes || 0),
            totalBytes: Number(status.totalBytes || this.appUpdate.release?.assetSize || 0)
        };
        if (status.status === 'downloaded') {
            this.stopAppUpdatePolling();
            this.appUpdate.phase = 'downloaded';
            this.appUpdate.message = `${this.appUpdate.release?.latestVersion || '新版本'} 已下载完成，可立即安装`;
        } else if (status.status === 'failed' || status.status === 'missing') {
            this.stopAppUpdatePolling();
            this.appUpdate.phase = 'failed';
            this.appUpdate.message = status.status === 'missing' ? '更新文件不存在，请重新下载' : '下载失败，请重新下载';
        } else {
            this.appUpdate.phase = status.status === 'pending' ? 'pending' : 'downloading';
            this.appUpdate.message = status.status === 'paused' ? '下载已暂停，等待网络恢复...' : '正在下载更新包...';
        }
        this.renderAppUpdate();
    }

    async installAppUpdate() {
        const updater = this.getAppUpdaterPlugin();
        if (!updater || !this.appUpdate.downloadId) return;
        try {
            this.appUpdate.phase = 'installing';
            this.appUpdate.message = '正在打开系统安装器...';
            this.renderAppUpdate();
            const result = await updater.installUpdate({ downloadId: this.appUpdate.downloadId });
            if (result?.permissionRequired) {
                this.appUpdate.phase = 'permission-install';
                this.appUpdate.message = '请在系统设置中允许安装未知应用，返回后点击安装。';
            } else {
                this.appUpdate.phase = 'install-started';
                this.appUpdate.message = '系统安装器已打开，完成安装后重新进入 App 即可。';
            }
            this.renderAppUpdate();
        } catch (error) {
            console.warn('启动更新安装失败', error);
            this.appUpdate.phase = 'downloaded';
            this.appUpdate.message = error?.message || '无法打开系统安装器，请重试';
            this.renderAppUpdate();
        }
    }

    stopAppUpdatePolling() {
        window.clearTimeout(this.appUpdate?.pollTimer);
        if (this.appUpdate) this.appUpdate.pollTimer = null;
    }

    renderAppUpdate() {
        const state = this.appUpdate;
        const action = document.getElementById('btn-app-update-action');
        const status = document.getElementById('app-update-status');
        const currentVersion = document.getElementById('app-update-current-version');
        const latestVersion = document.getElementById('app-update-latest-version');
        const notes = document.getElementById('app-update-notes');
        const progressBar = document.getElementById('app-update-progress-bar');
        const progressText = document.getElementById('app-update-progress-text');
        if (!action || !status || !currentVersion || !latestVersion || !notes || !progressBar || !progressText) return;

        const release = state.release || {};
        currentVersion.textContent = release.currentVersion || '--';
        latestVersion.textContent = release.latestVersion || '--';
        status.textContent = state.message || '准备检查更新';
        const releaseNotes = String(release.releaseNotes || '').trim().replace(/\s+/g, ' ');
        notes.textContent = releaseNotes ? releaseNotes.slice(0, 420) : '本次版本包含体验优化与问题修复。';

        const downloaded = Number(state.progress?.downloadedBytes || 0);
        const total = Number(state.progress?.totalBytes || release.assetSize || 0);
        const percent = total > 0 ? Math.max(0, Math.min(100, Math.round((downloaded / total) * 100))) : 0;
        const isDownloading = ['starting-download', 'pending', 'downloading'].includes(state.phase);
        progressBar.style.width = `${isDownloading || state.phase === 'downloaded' ? (state.phase === 'downloaded' ? 100 : percent) : 0}%`;
        progressText.textContent = isDownloading && total > 0
            ? `${percent}% · ${this.formatAppUpdateSize(downloaded)} / ${this.formatAppUpdateSize(total)}`
            : state.phase === 'downloaded'
                ? `已完成 · ${this.formatAppUpdateSize(total)}`
                : '';

        const labels = {
            checking: '正在检查',
            current: '完成',
            available: '下载更新',
            permission: '授权后重新下载',
            'starting-download': '准备下载',
            pending: '等待下载',
            downloading: '正在下载',
            failed: '重新下载',
            downloaded: '立即安装',
            installing: '正在打开安装器',
            'permission-install': '授权后安装',
            'install-started': '已打开安装器',
            error: '重新检查'
        };
        action.querySelector('span').textContent = labels[state.phase] || '检查更新';
        action.disabled = ['checking', 'starting-download', 'pending', 'downloading', 'installing', 'install-started'].includes(state.phase);
        if (window.lucide) window.lucide.createIcons();
    }

    formatAppUpdateSize(bytes) {
        const value = Number(bytes || 0);
        if (!Number.isFinite(value) || value <= 0) return '0 MB';
        if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
        return `${Math.max(1, Math.round(value / 1024))} KB`;
    }

    safeProjectName() {
        return (document.getElementById('project-name').value.trim() || '橱柜方案').replace(/[\\/:*?"<>|]/g, '-');
    }

    getFilesystemPlugin() {
        const capacitor = window.Capacitor;
        if (!capacitor || typeof capacitor.isNativePlatform !== 'function' || !capacitor.isNativePlatform()) {
            return null;
        }
        const filesystem = capacitor.Plugins && capacitor.Plugins.Filesystem;
        return filesystem && typeof filesystem.writeFile === 'function' ? filesystem : null;
    }

    async saveNativeFile(filename, data, folder, encoding) {
        const filesystem = this.getFilesystemPlugin();
        if (!filesystem) return false;
        try {
            if (typeof filesystem.checkPermissions === 'function' && typeof filesystem.requestPermissions === 'function') {
                const current = await filesystem.checkPermissions();
                if (current?.publicStorage === 'prompt' || current?.publicStorage === 'prompt-with-rationale') {
                    await filesystem.requestPermissions();
                }
            }
            const options = {
                path: `木序厨卫设计/${folder}/${filename}`,
                data,
                directory: 'DOCUMENTS',
                recursive: true
            };
            if (encoding) options.encoding = encoding;
            await filesystem.writeFile(options);
            this.showToast(`已保存到 Documents/${options.path}`);
            return true;
        } catch (e) {
            console.warn('Capacitor Filesystem 写入失败:', e);
            return false;
        }
    }

    async shareBlob(blob, filename) {
        if (typeof navigator.share !== 'function' || typeof File !== 'function') return false;
        try {
            await navigator.share({
                title: filename,
                files: [new File([blob], filename, { type: blob.type || 'application/octet-stream' })]
            });
            this.showToast('文件已分享');
            return true;
        } catch (e) {
            if (e && e.name === 'AbortError') return true;
            console.warn('系统分享失败:', e);
            return false;
        }
    }

    async downloadBlob(blob, filename, folder = '方案') {
        const isText = blob.type === 'application/json' || filename.toLowerCase().endsWith('.json');
        const data = isText ? await blob.text() : await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        if (await this.saveNativeFile(filename, data, folder, isText ? 'utf8' : null)) return true;

        if (await this.shareBlob(blob, filename)) return true;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.showToast('文件已导出');
        return true;
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        window.clearTimeout(this.toastTimer);
        toast.textContent = message;
        toast.classList.add('show');
        this.toastTimer = window.setTimeout(() => toast.classList.remove('show'), 1800);
    }
}

class LocalPlanRepository {
    constructor({ read, write, remove, indexKey, activeKey, recordPrefix }) {
        this.read = read;
        this.write = write;
        this.remove = remove;
        this.indexKey = indexKey;
        this.activeKey = activeKey;
        this.recordPrefix = recordPrefix;
    }

    recordKey(id) {
        return `${this.recordPrefix}${id}`;
    }

    readJson(key, fallback = null) {
        const raw = this.read(key);
        if (!raw) return fallback;
        try {
            return JSON.parse(raw);
        } catch (error) {
            console.warn('本地方案数据格式错误:', key, error);
            return fallback;
        }
    }

    list() {
        const index = this.readJson(this.indexKey, []);
        if (!Array.isArray(index)) return [];
        return index
            .filter(item => item && typeof item.id === 'string')
            .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    }

    writeIndex(index) {
        return this.write(this.indexKey, JSON.stringify(index));
    }

    getActiveId() {
        return this.read(this.activeKey) || null;
    }

    setActive(id) {
        return id ? this.write(this.activeKey, id) : this.remove(this.activeKey);
    }

    get(id) {
        if (!id) return null;
        const record = this.readJson(this.recordKey(id));
        return record && record.id === id && record.design ? record : null;
    }

    save(id, projectData) {
        const now = new Date().toISOString();
        const previous = this.get(id);
        const record = {
            ...projectData,
            id,
            createdAt: previous?.createdAt || projectData.createdAt || now,
            updatedAt: now
        };
        if (!this.write(this.recordKey(id), JSON.stringify(record))) return null;

        const design = record.design || {};
        const entry = {
            id,
            name: record.name || '未命名厨房',
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            moduleCount: Array.isArray(design.cabinets) ? design.cabinets.length : 0,
            roomWidth: Number(design.roomWidth) || 0,
            roomLength: Number(design.roomLength) || 0
        };
        const index = this.list().filter(item => item.id !== id);
        index.push(entry);
        if (!this.writeIndex(index)) return null;
        return record;
    }

    create(projectData) {
        const id = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        return this.save(id, projectData);
    }

    delete(id) {
        const index = this.list().filter(item => item.id !== id);
        const indexSaved = this.writeIndex(index);
        const recordRemoved = this.remove(this.recordKey(id));
        if (this.getActiveId() === id) this.setActive(null);
        return indexSaved && recordRemoved;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    try {
        window.app = new KitchenDesigner();
    } catch (error) {
        console.error('设计器初始化失败:', error);
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = '设计器初始化失败，请刷新页面';
            toast.classList.add('show');
        }
    }
});
