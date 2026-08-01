class Editor2D {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cabinets = [];
        this.walls = [];
        this.surfaceMaterials = {
            floor: 'marble-white',
            wall: 'marble-white'
        };
        this.activeSurfaceMaterial = 'marble-white';
        this.selectedCabinet = null;
        this.pendingModuleId = null;
        this.pendingModelVariantId = null;
        this.hoverPoint = null;
        this.mode = 'select';
        this.isDragging = false;
        this.isPanning = false;
        this.isDrawingWall = false;
        this.draftWall = null;
        this.dragOffset = { x: 0, y: 0 };
        this.panStart = { x: 0, y: 0, offsetX: 0, offsetY: 0 };
        this.dragStartSnapshot = null;
        this.scale = 100;
        this.minScale = 30;
        this.maxScale = 240;
        this.roomWidth = 2.5;
        this.roomLength = 3;
        this.offsetX = 0;
        this.offsetY = 0;
        this.viewportWidth = 0;
        this.viewportHeight = 0;
        this.showGrid = true;
        this.showDimensions = true;
        this.showSmartGuides = true;
        this.showClearance = true;
        this.snapEnabled = true;
        this.gridStep = 50;
        this.undoStack = [];
        this.redoStack = [];
        this.onSelect = null;
        this.onUpdate = null;
        this.onScaleChange = null;
        this.onHistoryChange = null;
        this.onModeChange = null;
        this.init();
    }

    init() {
        this.resize(true);
        this.bindEvents();
        this.draw();
    }

    resize(shouldFit = false) {
        const container = this.canvas.parentElement;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.viewportWidth = Math.max(1, container.clientWidth);
        this.viewportHeight = Math.max(1, container.clientHeight);
        this.canvas.style.width = `${this.viewportWidth}px`;
        this.canvas.style.height = `${this.viewportHeight}px`;
        this.canvas.width = Math.round(this.viewportWidth * dpr);
        this.canvas.height = Math.round(this.viewportHeight * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (shouldFit || !this.offsetX) {
            this.fitToRoom(false);
        } else {
            this.updateOffset();
        }
        this.draw();
    }

    fitToRoom(emit = true) {
        const padding = this.viewportWidth < 520 ? 42 : 76;
        const usableWidth = Math.max(100, this.viewportWidth - padding * 2);
        const usableHeight = Math.max(100, this.viewportHeight - padding * 2);
        this.scale = Math.max(
            this.minScale,
            Math.min(this.maxScale, usableWidth / this.roomWidth, usableHeight / this.roomLength)
        );
        this.updateOffset();
        this.draw();
        if (emit) this.emitScale();
    }

    setScale(nextScale) {
        this.scale = Math.max(this.minScale, Math.min(this.maxScale, nextScale));
        this.updateOffset();
        this.draw();
        this.emitScale();
    }

    zoomBy(delta) {
        this.setScale(this.scale + delta);
    }

    emitScale() {
        if (this.onScaleChange) this.onScaleChange(this.scale);
    }

    formatMetric(valueMm, digits = 2) {
        const meters = (Number(valueMm) || 0) / 1000;
        return `${meters.toFixed(digits).replace(/\.?0+$/, '')} m`;
    }

    formatMetricPair(widthMm, depthMm) {
        const width = this.formatMetric(widthMm).replace(' m', '');
        const depth = this.formatMetric(depthMm).replace(' m', '');
        return `${width} x ${depth} m`;
    }

    updateOffset() {
        const roomPixelWidth = this.roomWidth * this.scale;
        const roomPixelLength = this.roomLength * this.scale;
        this.offsetX = (this.viewportWidth - roomPixelWidth) / 2;
        this.offsetY = (this.viewportHeight - roomPixelLength) / 2;
    }

    setRoom(width, length) {
        this.roomWidth = width;
        this.roomLength = length;
        this.fitToRoom();
    }

    setToolMode(mode) {
        const allowedModes = ['select', 'pan', 'wall', 'material-floor', 'material-wall'];
        this.mode = allowedModes.includes(mode) ? mode : 'select';
        if (this.mode !== 'select') this.pendingModuleId = null;
        this.draftWall = null;
        this.canvas.style.cursor = this.getCursorForMode();
        this.draw();
        if (this.onModeChange) this.onModeChange({ mode: this.mode, pendingModuleId: this.pendingModuleId });
    }

    setPlacementModule(moduleId, modelVariantId = null) {
        this.pendingModuleId = moduleId;
        this.pendingModelVariantId = modelVariantId;
        this.mode = 'select';
        this.draftWall = null;
        this.draw();
        if (this.onModeChange) this.onModeChange({ mode: this.mode, pendingModuleId: this.pendingModuleId });
    }

    cancelPlacement() {
        if (!this.pendingModuleId) return false;
        this.pendingModuleId = null;
        this.pendingModelVariantId = null;
        this.hoverPoint = null;
        this.draw();
        if (this.onModeChange) this.onModeChange({ mode: this.mode, pendingModuleId: null });
        return true;
    }

    getCursorForMode() {
        if (this.mode === 'pan') return 'grab';
        if (this.mode === 'wall') return 'crosshair';
        if (this.mode.startsWith('material-')) return 'cell';
        return 'default';
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', event => this.handleStart(event));
        this.canvas.addEventListener('mousemove', event => this.handleMove(event));
        window.addEventListener('mouseup', () => this.handleEnd());
        this.canvas.addEventListener('contextmenu', event => event.preventDefault());

        this.canvas.addEventListener('touchstart', event => {
            event.preventDefault();
            if (event.touches.length === 1) {
                this.handleStart(event.touches[0]);
            } else if (event.touches.length === 2) {
                this.isDragging = false;
                this.lastPinchDist = this.getTouchDistance(event.touches);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', event => {
            event.preventDefault();
            if (event.touches.length === 1) {
                this.handleMove(event.touches[0]);
            } else if (event.touches.length === 2) {
                this.handlePinch(event.touches);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', event => {
            event.preventDefault();
            if (event.touches.length === 0) this.handleEnd();
            this.lastPinchDist = null;
        }, { passive: false });

        this.canvas.addEventListener('wheel', event => {
            event.preventDefault();
            this.zoomBy(event.deltaY > 0 ? -10 : 10);
        }, { passive: false });

        window.addEventListener('resize', () => this.resize());
    }

    getTouchDistance(touches) {
        return Math.hypot(
            touches[0].clientX - touches[1].clientX,
            touches[0].clientY - touches[1].clientY
        );
    }

    handlePinch(touches) {
        const distance = this.getTouchDistance(touches);
        if (this.lastPinchDist) {
            this.setScale(this.scale + (distance - this.lastPinchDist) * 0.25);
        }
        this.lastPinchDist = distance;
    }

    getCanvasPoint(event) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    getRoomPoint(point) {
        return {
            x: ((point.x - this.offsetX) / this.scale) * 1000,
            y: ((point.y - this.offsetY) / this.scale) * 1000
        };
    }

    clampRoomPoint(point) {
        return {
            x: Math.max(0, Math.min(this.roomWidth * 1000, this.snapValue(point.x))),
            y: Math.max(0, Math.min(this.roomLength * 1000, this.snapValue(point.y)))
        };
    }

    snapValue(value) {
        return this.snapEnabled ? Math.round(value / this.gridStep) * this.gridStep : value;
    }

    clampCabinetPosition(cabinet, x, y) {
        const footprint = this.getFootprint(cabinet);
        const maxX = Math.max(0, this.roomWidth * 1000 - footprint.width);
        const maxY = Math.max(0, this.roomLength * 1000 - footprint.depth);
        return {
            x: Math.max(0, Math.min(maxX, this.snapValue(x))),
            y: Math.max(0, Math.min(maxY, this.snapValue(y)))
        };
    }

    getFootprint(cabinet) {
        const quarterTurn = Math.round((cabinet.rotation || 0) / 90) % 2 !== 0;
        return quarterTurn
            ? { width: cabinet.depth, depth: cabinet.width }
            : { width: cabinet.width, depth: cabinet.depth };
    }

    getSelectionPriority(cabinet) {
        const moduleId = String(cabinet.moduleId || '');
        if (moduleId.includes('countertop')) return 0;
        if (moduleId.includes('glass-partition') || cabinet.materialKind === 'glass') return 1;
        if (cabinet.mountType === 'wall') return 4;
        if (cabinet.mountType === 'counter') return 3;
        return 2;
    }

    getCabinetAtPoint(point) {
        const tolerance = 8;
        const hits = [];
        for (let index = this.cabinets.length - 1; index >= 0; index -= 1) {
            const cabinet = this.cabinets[index];
            const footprint = this.getFootprint(cabinet);
            const x = this.offsetX + (cabinet.x / 1000) * this.scale;
            const y = this.offsetY + (cabinet.y / 1000) * this.scale;
            const width = (footprint.width / 1000) * this.scale;
            const depth = (footprint.depth / 1000) * this.scale;
            if (
                point.x >= x - tolerance && point.x <= x + width + tolerance &&
                point.y >= y - tolerance && point.y <= y + depth + tolerance
            ) {
                hits.push({
                    cabinet,
                    index,
                    area: footprint.width * footprint.depth,
                    priority: this.getSelectionPriority(cabinet)
                });
            }
        }
        if (!hits.length) return null;
        hits.sort((a, b) => {
            if (b.priority !== a.priority) return b.priority - a.priority;
            if (a.area !== b.area) return a.area - b.area;
            return b.index - a.index;
        });
        return hits[0].cabinet;
    }

    handleStart(event) {
        const point = this.getCanvasPoint(event);
        if (event.button === 1 || event.button === 2 || event.shiftKey || this.mode === 'pan') {
            this.isPanning = true;
            this.panStart = { x: point.x, y: point.y, offsetX: this.offsetX, offsetY: this.offsetY };
            this.canvas.classList.add('dragging');
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        if (this.mode === 'wall') {
            const start = this.clampRoomPoint(this.getRoomPoint(point));
            this.isDrawingWall = true;
            this.draftWall = { x1: start.x, y1: start.y, x2: start.x, y2: start.y, thickness: 100 };
            this.canvas.classList.add('dragging');
            this.draw();
            return;
        }

        if (this.mode === 'material-floor' || this.mode === 'material-wall') {
            const target = this.mode === 'material-floor' ? 'floor' : 'wall';
            this.applySurfaceMaterial(target, this.activeSurfaceMaterial);
            return;
        }

        if (this.pendingModuleId) {
            const cabinet = this.placePendingModule(point);
            if (cabinet) this.selectCabinet(cabinet);
            return;
        }

        const cabinet = this.getCabinetAtPoint(point);
        this.selectCabinet(cabinet);
        if (!cabinet) return;

        this.isDragging = true;
        this.dragStartSnapshot = this.captureSnapshot();
        const x = this.offsetX + (cabinet.x / 1000) * this.scale;
        const y = this.offsetY + (cabinet.y / 1000) * this.scale;
        this.dragOffset = { x: point.x - x, y: point.y - y };
        this.canvas.classList.add('dragging');
    }

    handleMove(event) {
        const point = this.getCanvasPoint(event);
        this.hoverPoint = point;
        if (this.isPanning) {
            this.offsetX = this.panStart.offsetX + point.x - this.panStart.x;
            this.offsetY = this.panStart.offsetY + point.y - this.panStart.y;
            this.draw();
            return;
        }

        if (this.pendingModuleId) {
            this.canvas.style.cursor = 'crosshair';
            this.draw();
            return;
        }

        if (this.isDrawingWall && this.draftWall) {
            const end = this.clampRoomPoint(this.getRoomPoint(point));
            const dx = Math.abs(end.x - this.draftWall.x1);
            const dy = Math.abs(end.y - this.draftWall.y1);
            if (dx > dy) end.y = this.draftWall.y1;
            else end.x = this.draftWall.x1;
            this.draftWall.x2 = end.x;
            this.draftWall.y2 = end.y;
            this.draw();
            return;
        }

        if (!this.isDragging || !this.selectedCabinet) {
            this.canvas.style.cursor = this.mode === 'select' && this.getCabinetAtPoint(point) ? 'grab' : this.getCursorForMode();
            return;
        }

        const footprint = this.getFootprint(this.selectedCabinet);
        let nextX = ((point.x - this.dragOffset.x - this.offsetX) / this.scale) * 1000;
        let nextY = ((point.y - this.dragOffset.y - this.offsetY) / this.scale) * 1000;
        nextX = this.snapValue(nextX);
        nextY = this.snapValue(nextY);

        const maxX = Math.max(0, this.roomWidth * 1000 - footprint.width);
        const maxY = Math.max(0, this.roomLength * 1000 - footprint.depth);
        this.selectedCabinet.x = Math.max(0, Math.min(maxX, nextX));
        this.selectedCabinet.y = Math.max(0, Math.min(maxY, nextY));
        this.draw();
    }

    handleEnd() {
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.classList.remove('dragging');
            this.canvas.style.cursor = this.getCursorForMode();
            return;
        }
        if (this.isDrawingWall) {
            this.isDrawingWall = false;
            this.canvas.classList.remove('dragging');
            const wall = this.draftWall;
            this.draftWall = null;
            if (wall && Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1) >= 250) {
                this.recordHistory();
                this.walls.push({
                    id: Date.now() + Math.random(),
                    x1: wall.x1,
                    y1: wall.y1,
                    x2: wall.x2,
                    y2: wall.y2,
                    thickness: wall.thickness || 100,
                    height: 2500,
                    type: 'partition'
                });
                this.emitUpdate();
            } else {
                this.draw();
            }
            return;
        }
        if (!this.isDragging) return;
        this.isDragging = false;
        this.canvas.classList.remove('dragging');
        if (this.dragStartSnapshot && !this.snapshotsEqual(this.dragStartSnapshot, this.captureSnapshot())) {
            this.pushUndoSnapshot(this.dragStartSnapshot);
            this.redoStack = [];
            this.emitHistory();
            this.emitUpdate();
        }
        this.dragStartSnapshot = null;
    }

    selectCabinet(cabinet) {
        this.selectedCabinet = cabinet || null;
        if (this.onSelect) this.onSelect(this.selectedCabinet);
        this.draw();
    }

    deselect() {
        this.selectCabinet(null);
    }

    addCabinet(moduleId) {
        const cabinet = createCabinetInstance(moduleId, 0, 0);
        if (!cabinet) return;
        this.recordHistory();
        const footprint = this.getFootprint(cabinet);
        cabinet.x = Math.max(0, Math.round((this.roomWidth * 1000 - footprint.width) / 2 / this.gridStep) * this.gridStep);
        cabinet.y = Math.max(0, Math.round((this.roomLength * 1000 - footprint.depth) / 2 / this.gridStep) * this.gridStep);
        this.cabinets.push(cabinet);
        this.selectCabinet(cabinet);
        this.emitUpdate();
    }

    placePendingModule(point) {
        const cabinet = createCabinetInstance(this.pendingModuleId, 0, 0, this.pendingModelVariantId);
        if (!cabinet) return null;
        this.recordHistory();
        const roomPoint = this.getRoomPoint(point);
        const footprint = this.getFootprint(cabinet);
        const placed = this.clampCabinetPosition(cabinet, roomPoint.x - footprint.width / 2, roomPoint.y - footprint.depth / 2);
        cabinet.x = placed.x;
        cabinet.y = placed.y;
        this.cabinets.push(cabinet);
        this.pendingModuleId = null;
        this.pendingModelVariantId = null;
        this.hoverPoint = null;
        this.emitUpdate();
        if (this.onModeChange) this.onModeChange({ mode: this.mode, pendingModuleId: null });
        return cabinet;
    }

    duplicateCabinet(cabinet) {
        if (!cabinet) return null;
        this.recordHistory();
        const copy = createCabinetInstance(cabinet.moduleId, cabinet.x, cabinet.y);
        if (!copy) return null;
        Object.assign(copy, this.serializeCabinet(cabinet), { id: Date.now() + Math.random() });
        const footprint = this.getFootprint(copy);
        copy.x = Math.min(Math.max(0, this.roomWidth * 1000 - footprint.width), cabinet.x + 100);
        copy.y = Math.min(Math.max(0, this.roomLength * 1000 - footprint.depth), cabinet.y + 100);
        this.cabinets.push(copy);
        this.selectCabinet(copy);
        this.emitUpdate();
        return copy;
    }

    snapToWall(cabinet) {
        if (!cabinet) return;
        this.recordHistory();
        const footprint = this.getFootprint(cabinet);
        const roomWidth = this.roomWidth * 1000;
        const roomLength = this.roomLength * 1000;
        const distances = [
            { edge: 'left', value: cabinet.x },
            { edge: 'right', value: roomWidth - cabinet.x - footprint.width },
            { edge: 'top', value: cabinet.y },
            { edge: 'bottom', value: roomLength - cabinet.y - footprint.depth }
        ];
        const closest = distances.sort((a, b) => a.value - b.value)[0].edge;
        if (closest === 'left') cabinet.x = 0;
        if (closest === 'right') cabinet.x = Math.max(0, roomWidth - footprint.width);
        if (closest === 'top') cabinet.y = 0;
        if (closest === 'bottom') cabinet.y = Math.max(0, roomLength - footprint.depth);
        this.emitUpdate();
    }

    deleteCabinet(cabinet) {
        const index = this.cabinets.indexOf(cabinet);
        if (index < 0) return;
        this.recordHistory();
        this.cabinets.splice(index, 1);
        this.selectCabinet(null);
        this.emitUpdate();
    }

    rotateCabinet(cabinet) {
        if (!cabinet) return;
        this.recordHistory();
        cabinet.rotation = ((cabinet.rotation || 0) + 90) % 360;
        const footprint = this.getFootprint(cabinet);
        cabinet.x = Math.min(cabinet.x, Math.max(0, this.roomWidth * 1000 - footprint.width));
        cabinet.y = Math.min(cabinet.y, Math.max(0, this.roomLength * 1000 - footprint.depth));
        this.emitUpdate();
    }

    nudgeSelected(deltaX, deltaY) {
        const cabinet = this.selectedCabinet;
        if (!cabinet) return;
        this.recordHistory();
        const footprint = this.getFootprint(cabinet);
        cabinet.x = Math.max(0, Math.min(this.roomWidth * 1000 - footprint.width, cabinet.x + deltaX));
        cabinet.y = Math.max(0, Math.min(this.roomLength * 1000 - footprint.depth, cabinet.y + deltaY));
        this.emitUpdate();
    }

    updateCabinetProp(cabinet, property, value) {
        if (!cabinet || cabinet[property] === value) return;
        this.recordHistory();
        cabinet[property] = value;
        if (property === 'color') cabinet.customColor = true;
        const footprint = this.getFootprint(cabinet);
        cabinet.x = Math.min(cabinet.x, Math.max(0, this.roomWidth * 1000 - footprint.width));
        cabinet.y = Math.min(cabinet.y, Math.max(0, this.roomLength * 1000 - footprint.depth));
        this.emitUpdate();
    }

    clear() {
        if (!this.cabinets.length && !this.walls.length) return;
        this.recordHistory();
        this.cabinets = [];
        this.walls = [];
        this.selectCabinet(null);
        this.emitUpdate();
    }

    serializeCabinet(cabinet) {
        return {
            id: cabinet.id,
            moduleId: cabinet.moduleId,
            x: cabinet.x,
            y: cabinet.y,
            width: cabinet.width,
            depth: cabinet.depth,
            height: cabinet.height,
            elevation: Number.isFinite(cabinet.elevation) ? cabinet.elevation : 0,
            color: cabinet.color,
            customColor: Boolean(cabinet.customColor),
            accentColor: cabinet.accentColor || '#6f7d83',
            countertopColor: cabinet.countertopColor || '#f0f0f0',
            materialKind: cabinet.materialKind || 'painted',
            countertopMaterial: cabinet.countertopMaterial || null,
            doorCount: cabinet.doorCount || 0,
            drawerCount: cabinet.drawerCount || 0,
            openShelves: cabinet.openShelves || 0,
            glass: Boolean(cabinet.glass),
            hasSink: Boolean(cabinet.hasSink),
            applianceFace: cabinet.applianceFace || null,
            handleStyle: cabinet.handleStyle || 'bar',
            doorStyle: cabinet.doorStyle || 'framed',
            appearanceVersion: cabinet.appearanceVersion || null,
            fixtureKind: cabinet.fixtureKind || null,
            modelVariantId: cabinet.modelVariantId || null,
            finishName: cabinet.finishName || '标准饰面',
            rotation: cabinet.rotation || 0,
            mountType: cabinet.mountType || 'floor'
        };
    }

    captureCabinets() {
        return this.cabinets.map(cabinet => this.serializeCabinet(cabinet));
    }

    captureWalls() {
        return this.walls.map(wall => ({
            id: wall.id,
            x1: wall.x1,
            y1: wall.y1,
            x2: wall.x2,
            y2: wall.y2,
            thickness: wall.thickness || 100,
            height: wall.height || 2500,
            type: wall.type || 'partition'
        }));
    }

    captureSnapshot() {
        return {
            cabinets: this.captureCabinets(),
            walls: this.captureWalls(),
            surfaceMaterials: { ...this.surfaceMaterials }
        };
    }

    snapshotsEqual(first, second) {
        return JSON.stringify(first) === JSON.stringify(second);
    }

    pushUndoSnapshot(snapshot) {
        this.undoStack.push(snapshot);
        if (this.undoStack.length > 60) this.undoStack.shift();
    }

    recordHistory() {
        this.pushUndoSnapshot(this.captureSnapshot());
        this.redoStack = [];
        this.emitHistory();
    }

    restoreSnapshot(snapshot) {
        const cabinetSnapshot = Array.isArray(snapshot) ? snapshot : snapshot.cabinets;
        this.cabinets = (cabinetSnapshot || []).map(data => {
            const cabinet = createCabinetInstance(data.moduleId, data.x, data.y);
            if (!cabinet) return null;
            Object.assign(cabinet, data);
            // Pre-neutral-v1 plans stored the then-current catalogue defaults in
            // every cabinet. Refresh only those defaults, while preserving any
            // colour a designer explicitly picked.
            if (data.appearanceVersion !== 'neutral-v1') {
                const currentModule = findCabinetModule(data.moduleId);
                if (!data.customColor) cabinet.color = currentModule?.color || cabinet.color;
                cabinet.countertopColor = currentModule?.countertopColor || cabinet.countertopColor;
                cabinet.accentColor = currentModule?.accentColor || cabinet.accentColor;
                cabinet.materialKind = currentModule?.materialKind || cabinet.materialKind;
                cabinet.doorStyle = currentModule?.doorStyle || cabinet.doorStyle;
                cabinet.handleStyle = currentModule?.handleStyle || cabinet.handleStyle;
                cabinet.finishName = currentModule?.finishName || cabinet.finishName;
                cabinet.appearanceVersion = 'neutral-v1';
            }
            return cabinet;
        }).filter(Boolean);
        this.walls = Array.isArray(snapshot?.walls) ? snapshot.walls.map(wall => ({ ...wall })) : [];
        this.surfaceMaterials = {
            floor: 'marble-white',
            wall: 'marble-white',
            ...(snapshot?.surfaceMaterials || {})
        };
        this.selectedCabinet = null;
    }

    undo() {
        if (!this.undoStack.length) return;
        this.redoStack.push(this.captureSnapshot());
        this.restoreSnapshot(this.undoStack.pop());
        this.selectCabinet(null);
        this.emitHistory();
        this.emitUpdate();
    }

    redo() {
        if (!this.redoStack.length) return;
        this.pushUndoSnapshot(this.captureSnapshot());
        this.restoreSnapshot(this.redoStack.pop());
        this.selectCabinet(null);
        this.emitHistory();
        this.emitUpdate();
    }

    emitHistory() {
        if (this.onHistoryChange) {
            this.onHistoryChange({ canUndo: this.undoStack.length > 0, canRedo: this.redoStack.length > 0 });
        }
    }

    emitUpdate() {
        this.draw();
        if (this.onUpdate) this.onUpdate();
    }

    setGridEnabled(enabled) {
        this.showGrid = enabled;
        this.snapEnabled = enabled;
        this.draw();
    }

    setDesignAid(type, enabled) {
        if (type === 'dimensions') this.showDimensions = enabled;
        if (type === 'guides') this.showSmartGuides = enabled;
        if (type === 'clearance') this.showClearance = enabled;
        this.draw();
    }

    setActiveSurfaceMaterial(materialId) {
        this.activeSurfaceMaterial = materialId || this.activeSurfaceMaterial;
        this.draw();
    }

    applySurfaceMaterial(target, materialId) {
        if (!['floor', 'wall'].includes(target) || !materialId) return;
        if (this.surfaceMaterials[target] === materialId) return;
        this.recordHistory();
        this.surfaceMaterials[target] = materialId;
        this.emitUpdate();
    }

    deleteLastWall() {
        if (!this.walls.length) return false;
        this.recordHistory();
        this.walls.pop();
        this.emitUpdate();
        return true;
    }

    getCollisionLayer(cabinet) {
        if (cabinet.mountType === 'wall') return 'wall';
        if (cabinet.mountType === 'counter') return 'counter';
        if (cabinet.moduleId.includes('countertop')) return 'countertop';
        return 'floor';
    }

    getCollisions() {
        const collisions = [];
        for (let firstIndex = 0; firstIndex < this.cabinets.length; firstIndex += 1) {
            const first = this.cabinets[firstIndex];
            const firstFootprint = this.getFootprint(first);
            for (let secondIndex = firstIndex + 1; secondIndex < this.cabinets.length; secondIndex += 1) {
                const second = this.cabinets[secondIndex];
                if (this.getCollisionLayer(first) !== this.getCollisionLayer(second)) continue;
                const secondFootprint = this.getFootprint(second);
                const overlaps =
                    first.x < second.x + secondFootprint.width &&
                    first.x + firstFootprint.width > second.x &&
                    first.y < second.y + secondFootprint.depth &&
                    first.y + firstFootprint.depth > second.y;
                if (overlaps) collisions.push([first, second]);
            }
        }
        return collisions;
    }

    draw() {
        const context = this.ctx;
        context.clearRect(0, 0, this.viewportWidth, this.viewportHeight);
        // Keep the plan in the same graphite, cool-cyan and warm-accent family
        // as the studio shell. The room itself stays neutral for measurement.
        context.fillStyle = '#081014';
        context.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
        if (this.showGrid) this.drawGrid();
        this.drawRoom();
        this.drawWalls();
        if (this.showDimensions) this.drawRoomRulers();

        const collidingIds = new Set(this.getCollisions().flat().map(cabinet => cabinet.id));
        this.cabinets.forEach(cabinet => this.drawCabinet(cabinet, collidingIds.has(cabinet.id)));
        if (this.pendingModuleId && this.hoverPoint) this.drawPlacementPreview();
        if (this.showSmartGuides) this.drawSmartGuides();
        if (this.showClearance) this.drawClearanceChecks(collidingIds);
        if (this.selectedCabinet) this.drawSelection(this.selectedCabinet);
        if (this.draftWall) this.drawWall(this.draftWall, true);
        if (this.showDimensions) this.drawDimensions();
    }

    drawGrid() {
        const context = this.ctx;
        const minor = Math.max(8, this.scale / 10);
        const major = this.scale / 2;
        context.save();
        context.lineWidth = 1;

        for (let x = this.offsetX % minor, index = 0; x < this.viewportWidth; x += minor, index += 1) {
            context.strokeStyle = index % 5 === 0 ? 'rgba(104, 243, 232, 0.12)' : 'rgba(218, 232, 228, 0.045)';
            context.beginPath();
            context.moveTo(Math.round(x) + 0.5, 0);
            context.lineTo(Math.round(x) + 0.5, this.viewportHeight);
            context.stroke();
        }
        for (let y = this.offsetY % minor, index = 0; y < this.viewportHeight; y += minor, index += 1) {
            context.strokeStyle = index % 5 === 0 ? 'rgba(104, 243, 232, 0.12)' : 'rgba(218, 232, 228, 0.045)';
            context.beginPath();
            context.moveTo(0, Math.round(y) + 0.5);
            context.lineTo(this.viewportWidth, Math.round(y) + 0.5);
            context.stroke();
        }

        context.fillStyle = 'rgba(252, 238, 9, 0.2)';
        for (let x = this.offsetX % major; x < this.viewportWidth; x += major) {
            for (let y = this.offsetY % major; y < this.viewportHeight; y += major) {
                context.fillRect(Math.round(x), Math.round(y), 1, 1);
            }
        }
        context.restore();
    }

    drawRoom() {
        const context = this.ctx;
        const width = this.roomWidth * this.scale;
        const length = this.roomLength * this.scale;
        const floorStyles = {
            'stone-grey': ['#344349', '#617277'],
            'marble-white': ['#e8efed', '#c5d1ce'],
            'warm-tile': ['#aa9c81', '#c6b897'],
            'wood-oak': ['#75583d', '#99764f'],
            'dark-slate': ['#19272d', '#2b3a40'],
            'ph-concrete-tile': ['#68777a', '#87979a'],
            'ph-brown-floor': ['#5a422f', '#7d5c3f'],
            'ph-parquet': ['#704a2d', '#986641'],
            'ph-dark-wood': ['#241b16', '#38281e'],
            'ph-fine-wood': ['#7a5737', '#a57548'],
            'ph-metal-plate': ['#3c4a4e', '#65767a'],
            'acg-tiles107': ['#d9e0df', '#f6f8f7'],
            'acg-tiles036': ['#d8dfdf', '#f1f5f4'],
            'acg-marble021': ['#d6dddc', '#f2f5f4'],
            'acg-metal009': ['#6f7979', '#b9c1c0'],
            'acg-wood049': ['#87643f', '#c09b6b']
        };
        const colors = floorStyles[this.surfaceMaterials.floor] || floorStyles['stone-grey'];
        context.save();
        context.shadowColor = 'rgba(104, 243, 232, 0.13)';
        context.shadowBlur = 18;
        context.shadowOffsetY = 0;
        const gradient = context.createLinearGradient(this.offsetX, this.offsetY, this.offsetX + width, this.offsetY + length);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        context.fillStyle = gradient;
        context.fillRect(this.offsetX, this.offsetY, width, length);
        context.globalAlpha = 0.16;
        context.strokeStyle = '#e7eeea';
        context.lineWidth = 1;
        const tileSize = Math.max(18, this.scale * 0.5);
        for (let x = this.offsetX + tileSize; x < this.offsetX + width; x += tileSize) {
            context.beginPath();
            context.moveTo(x, this.offsetY);
            context.lineTo(x, this.offsetY + length);
            context.stroke();
        }
        for (let y = this.offsetY + tileSize; y < this.offsetY + length; y += tileSize) {
            context.beginPath();
            context.moveTo(this.offsetX, y);
            context.lineTo(this.offsetX + width, y);
            context.stroke();
        }
        context.restore();
        context.strokeStyle = '#f0df76';
        context.lineWidth = 3;
        context.strokeRect(this.offsetX, this.offsetY, width, length);
        context.strokeStyle = 'rgba(104, 243, 232, 0.38)';
        context.lineWidth = 1;
        context.strokeRect(this.offsetX + 5, this.offsetY + 5, Math.max(0, width - 10), Math.max(0, length - 10));
    }

    drawWalls() {
        this.walls.forEach(wall => this.drawWall(wall, false));
    }

    drawWall(wall, isDraft = false) {
        const context = this.ctx;
        const x1 = this.offsetX + (wall.x1 / 1000) * this.scale;
        const y1 = this.offsetY + (wall.y1 / 1000) * this.scale;
        const x2 = this.offsetX + (wall.x2 / 1000) * this.scale;
        const y2 = this.offsetY + (wall.y2 / 1000) * this.scale;
        const thickness = Math.max(4, ((wall.thickness || 100) / 1000) * this.scale);
        context.save();
        context.lineCap = 'square';
        context.lineJoin = 'miter';
        context.lineWidth = thickness + 5;
        context.strokeStyle = isDraft ? 'rgba(252, 238, 9, 0.5)' : 'rgba(4, 7, 9, 0.92)';
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
        context.lineWidth = thickness;
        context.strokeStyle = isDraft ? '#f6de68' : '#d9e2dd';
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
        context.lineWidth = 1;
        context.strokeStyle = isDraft ? '#fff4bc' : 'rgba(223, 232, 227, 0.52)';
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
        const length = Math.round(Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1));
        if (length > 400) {
            context.fillStyle = 'rgba(5, 8, 10, 0.88)';
            context.font = '600 10px Inter, sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            context.fillRect(mx - 34, my - 10, 68, 20);
            context.fillStyle = isDraft ? '#fff0a4' : '#d9e5df';
            context.fillText(this.formatMetric(length), mx, my);
        }
        context.restore();
    }

    drawRoomRulers() {
        const context = this.ctx;
        const width = this.roomWidth * this.scale;
        const length = this.roomLength * this.scale;
        const x0 = this.offsetX;
        const y0 = this.offsetY;
        const tick = 7;
        const meterStep = this.scale;

        context.save();
        context.strokeStyle = 'rgba(252, 238, 9, 0.42)';
        context.fillStyle = '#d7e3dc';
        context.lineWidth = 1;
        context.font = '10px Inter, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        context.beginPath();
        context.moveTo(x0, y0 - 30);
        context.lineTo(x0 + width, y0 - 30);
        context.moveTo(x0 - 30, y0);
        context.lineTo(x0 - 30, y0 + length);
        context.stroke();

        for (let x = x0, meter = 0; x <= x0 + width + 0.5; x += meterStep, meter += 1) {
            context.beginPath();
            context.moveTo(x, y0 - 30);
            context.lineTo(x, y0 - 30 - tick);
            context.stroke();
            if (meter > 0 && x < x0 + width) context.fillText(`${meter}m`, x, y0 - 48);
        }

        context.save();
        context.translate(x0 - 48, y0);
        context.rotate(-Math.PI / 2);
        for (let y = y0, meter = 0; y <= y0 + length + 0.5; y += meterStep, meter += 1) {
            const local = -(y - y0);
            context.beginPath();
            context.moveTo(local, 18);
            context.lineTo(local, 18 + tick);
            context.stroke();
            if (meter > 0 && y < y0 + length) context.fillText(`${meter}m`, local, 0);
        }
        context.restore();
        context.restore();
    }

    drawCabinet(cabinet, hasCollision) {
        const context = this.ctx;
        const footprint = this.getFootprint(cabinet);
        const x = this.offsetX + (cabinet.x / 1000) * this.scale;
        const y = this.offsetY + (cabinet.y / 1000) * this.scale;
        const footprintWidth = (footprint.width / 1000) * this.scale;
        const footprintDepth = (footprint.depth / 1000) * this.scale;
        const palette = this.getPlanPalette(cabinet);

        context.save();
        context.fillStyle = palette.fill;
        context.strokeStyle = palette.stroke;
        context.lineWidth = hasCollision ? 2 : 1.35;
        context.fillRect(x, y, footprintWidth, footprintDepth);
        context.strokeRect(x + 0.5, y + 0.5, Math.max(0, footprintWidth - 1), Math.max(0, footprintDepth - 1));
        this.drawPlanSymbol(cabinet, x, y, footprintWidth, footprintDepth, palette);
        context.restore();

        if (hasCollision) {
            context.fillStyle = 'rgba(177, 58, 58, 0.18)';
            context.fillRect(x, y, footprintWidth, footprintDepth);
            context.strokeStyle = '#b13a3a';
            context.lineWidth = 1.5;
            context.strokeRect(x, y, footprintWidth, footprintDepth);
        }

        if (this.showDimensions) {
            context.fillStyle = '#5f6962';
            context.font = '10px Inter, sans-serif';
            context.textAlign = 'center';
            context.fillText(this.formatMetricPair(footprint.width, footprint.depth), x + footprintWidth / 2, y + footprintDepth + 13);
        }
    }

    getPlanPalette(cabinet) {
        const layer = this.getCollisionLayer(cabinet);
        const moduleId = String(cabinet.moduleId || '');
        const baseColor = cabinet.color || '#f5f5f5';
        const tinted = {
            fill: this.colorWithAlpha(baseColor, 0.94),
            stroke: this.shiftPlanColor(baseColor, -0.34),
            detail: this.shiftPlanColor(baseColor, -0.48),
            accent: this.shiftPlanColor(baseColor, 0.2)
        };
        const isAppliance = /fridge|oven|microwave|dishwasher|washer|cooktop|hood|heater|sterilizer|coffee/.test(moduleId);
        const isBath = /bath|toilet|basin|shower|tub|drain|faucet|rack/.test(moduleId);
        const isCountertop = layer === 'counter' || moduleId.includes('countertop');

        if (isCountertop) {
            return {
                ...tinted,
                fill: this.colorWithAlpha(cabinet.countertopColor || baseColor, 0.94),
                stroke: this.shiftPlanColor(cabinet.countertopColor || baseColor, -0.32),
                detail: this.shiftPlanColor(cabinet.countertopColor || baseColor, -0.46),
                accent: this.shiftPlanColor(cabinet.countertopColor || baseColor, 0.18)
            };
        }
        if (isAppliance || isBath || layer === 'wall' || cabinet.mountType === 'floor') return tinted;
        return tinted;
    }

    shiftPlanColor(color, amount = 0) {
        const raw = String(color || '').trim();
        const hex = raw.startsWith('#') ? raw.slice(1) : '';
        if (hex.length !== 3 && hex.length !== 6) return amount < 0 ? '#384047' : '#e6ecec';
        const full = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex;
        const value = Number.parseInt(full, 16);
        if (!Number.isFinite(value)) return amount < 0 ? '#384047' : '#e6ecec';
        const mix = amount >= 0 ? 255 : 0;
        const ratio = Math.min(1, Math.abs(amount));
        const channel = shift => Math.round(((value >> shift) & 255) * (1 - ratio) + mix * ratio);
        return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
    }

    colorWithAlpha(color, alpha = 1) {
        const raw = String(color || '').trim();
        const hex = raw.startsWith('#') ? raw.slice(1) : '';
        if (hex.length === 3 || hex.length === 6) {
            const full = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex;
            const value = Number.parseInt(full, 16);
            if (Number.isFinite(value)) {
                const r = (value >> 16) & 255;
                const g = (value >> 8) & 255;
                const b = value & 255;
                return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
            }
        }
        return raw || 'rgba(216, 201, 173, ' + alpha + ')';
    }

    drawPlanSymbol(cabinet, x, y, width, depth, palette) {
        const context = this.ctx;
        const moduleId = String(cabinet.moduleId || '');
        const pad = Math.max(3, Math.min(9, Math.min(width, depth) * 0.12));
        const innerX = x + pad;
        const innerY = y + pad;
        const innerW = Math.max(0, width - pad * 2);
        const innerD = Math.max(0, depth - pad * 2);
        const line = Math.max(1, Math.min(1.7, Math.min(width, depth) * 0.015));

        context.save();
        context.strokeStyle = palette.detail;
        context.fillStyle = palette.detail;
        context.lineWidth = line;
        context.lineCap = 'round';
        context.lineJoin = 'round';

        if (moduleId.includes('countertop')) {
            this.drawPlanCountertop(innerX, innerY, innerW, innerD, palette);
        } else if (cabinet.fixtureKind === 'plant' || moduleId.includes('plant')) {
            this.drawPlanPlant(innerX, innerY, innerW, innerD);
        } else if (cabinet.fixtureKind === 'window' || moduleId.includes('window')) {
            this.drawPlanWindow(innerX, innerY, innerW, innerD);
        } else if (cabinet.fixtureKind === 'curtain' || moduleId.includes('curtain')) {
            this.drawPlanCurtain(innerX, innerY, innerW, innerD);
        } else if (cabinet.fixtureKind === 'wall-art' || moduleId.includes('frame') || moduleId.includes('wall-art')) {
            this.drawPlanWallArt(innerX, innerY, innerW, innerD);
        } else if (cabinet.fixtureKind === 'mat' || moduleId.includes('mat') || moduleId.includes('rug')) {
            this.drawPlanMat(innerX, innerY, innerW, innerD);
        } else if (cabinet.fixtureKind === 'basket' || moduleId.includes('basket')) {
            this.drawPlanBasket(innerX, innerY, innerW, innerD);
        } else if (cabinet.fixtureKind === 'vase' || moduleId.includes('vase')) {
            this.drawPlanVase(innerX, innerY, innerW, innerD);
        } else if (cabinet.fixtureKind === 'light' || moduleId.includes('lamp')) {
            this.drawPlanLight(innerX, innerY, innerW, innerD);
        } else if (cabinet.hasSink || moduleId.includes('sink') || moduleId.includes('basin') || moduleId.includes('vanity')) {
            this.drawPlanSink(innerX, innerY, innerW, innerD, moduleId.includes('double'));
        } else if (moduleId.includes('cooktop') || moduleId.includes('induction')) {
            this.drawPlanCooktop(innerX, innerY, innerW, innerD);
        } else if (moduleId.includes('range-hood') || moduleId.includes('hood') || moduleId.includes('heater')) {
            this.drawPlanHood(innerX, innerY, innerW, innerD);
        } else if (moduleId.includes('fridge')) {
            this.drawPlanFridge(innerX, innerY, innerW, innerD, moduleId.includes('big'));
        } else if (moduleId.includes('oven') || moduleId.includes('microwave') || moduleId.includes('dishwasher') || moduleId.includes('sterilizer') || moduleId.includes('coffee')) {
            this.drawPlanAppliance(innerX, innerY, innerW, innerD, moduleId);
        } else if (moduleId.includes('washer')) {
            this.drawPlanWasher(innerX, innerY, innerW, innerD);
        } else if (moduleId.includes('toilet')) {
            this.drawPlanToilet(innerX, innerY, innerW, innerD);
        } else if (moduleId.includes('shower') || moduleId.includes('partition')) {
            this.drawPlanShower(innerX, innerY, innerW, innerD, moduleId.includes('partition'));
        } else if (moduleId.includes('tub')) {
            this.drawPlanTub(innerX, innerY, innerW, innerD);
        } else if (moduleId.includes('drain')) {
            this.drawPlanDrain(innerX, innerY, innerW, innerD);
        } else if (moduleId.includes('rack') || moduleId.includes('niche') || moduleId.includes('open') || cabinet.openShelves) {
            this.drawPlanShelves(innerX, innerY, innerW, innerD, cabinet.openShelves || 3);
        } else if (moduleId.includes('drawer') || moduleId.includes('pull-out') || moduleId.includes('trash') || cabinet.drawerCount) {
            this.drawPlanDrawers(innerX, innerY, innerW, innerD, cabinet.drawerCount || 3);
        } else if (moduleId.includes('corner-l') || moduleId.includes('magic-corner')) {
            this.drawPlanCorner(innerX, innerY, innerW, innerD, 'l');
        } else if (moduleId.includes('corner-u')) {
            this.drawPlanCorner(innerX, innerY, innerW, innerD, 'u');
        } else if (moduleId.includes('island')) {
            this.drawPlanIsland(innerX, innerY, innerW, innerD);
        } else {
            const count = Math.max(1, Math.min(4, cabinet.doorCount || (width > depth * 1.8 ? 4 : width > depth * 1.25 ? 2 : 1)));
            this.drawPlanDoorSplit(innerX, innerY, innerW, innerD, count);
        }

        if (cabinet.mountType === 'wall') {
            this.drawPlanWallMountMark(x, y, width, depth, palette);
        }

        context.restore();
    }

    drawPlanPlant(x, y, width, depth) {
        const context = this.ctx;
        const cx = x + width / 2;
        const cy = y + depth / 2;
        const radius = Math.max(3, Math.min(width, depth) * 0.18);
        context.beginPath();
        context.arc(cx, cy, radius * 0.72, 0, Math.PI * 2);
        context.stroke();
        for (let i = 0; i < 6; i += 1) {
            const angle = (Math.PI * 2 * i) / 6;
            context.beginPath();
            context.ellipse(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, radius * 0.82, radius * 0.34, angle, 0, Math.PI * 2);
            context.stroke();
        }
    }

    drawPlanWindow(x, y, width, depth) {
        const context = this.ctx;
        context.strokeRect(x, y, width, depth);
        context.beginPath();
        context.moveTo(x + width / 2, y);
        context.lineTo(x + width / 2, y + depth);
        context.moveTo(x, y + depth / 2);
        context.lineTo(x + width, y + depth / 2);
        context.stroke();
    }

    drawPlanCurtain(x, y, width, depth) {
        const context = this.ctx;
        context.beginPath();
        const folds = 7;
        for (let i = 0; i <= folds; i += 1) {
            const px = x + (width * i) / folds;
            const py = y + depth * (i % 2 ? 0.8 : 0.2);
            if (i === 0) context.moveTo(px, py);
            else context.lineTo(px, py);
        }
        context.stroke();
        context.strokeRect(x, y, width, depth);
    }

    drawPlanWallArt(x, y, width, depth) {
        const context = this.ctx;
        context.strokeRect(x, y, width, depth);
        context.beginPath();
        context.moveTo(x + width * 0.12, y + depth * 0.78);
        context.lineTo(x + width * 0.38, y + depth * 0.42);
        context.lineTo(x + width * 0.58, y + depth * 0.65);
        context.lineTo(x + width * 0.82, y + depth * 0.28);
        context.stroke();
    }

    drawPlanMat(x, y, width, depth) {
        this.drawRoundedPlanRect(x, y, width, depth, Math.max(3, Math.min(width, depth) * 0.14));
        const context = this.ctx;
        context.setLineDash([3, 3]);
        context.strokeRect(x + width * 0.12, y + depth * 0.16, width * 0.76, depth * 0.68);
        context.setLineDash([]);
    }

    drawPlanBasket(x, y, width, depth) {
        const context = this.ctx;
        this.drawRoundedPlanRect(x, y, width, depth, Math.max(3, Math.min(width, depth) * 0.12));
        for (let i = 1; i < 4; i += 1) {
            context.beginPath();
            context.moveTo(x + (width * i) / 4, y + depth * 0.08);
            context.lineTo(x + (width * i) / 4, y + depth * 0.92);
            context.stroke();
        }
    }

    drawPlanVase(x, y, width, depth) {
        const context = this.ctx;
        context.beginPath();
        context.ellipse(x + width / 2, y + depth / 2, width * 0.28, depth * 0.38, 0, 0, Math.PI * 2);
        context.stroke();
        context.beginPath();
        context.arc(x + width / 2, y + depth / 2, Math.min(width, depth) * 0.09, 0, Math.PI * 2);
        context.stroke();
    }

    drawPlanLight(x, y, width, depth) {
        const context = this.ctx;
        const radius = Math.max(3, Math.min(width, depth) * 0.3);
        context.beginPath();
        context.arc(x + width / 2, y + depth / 2, radius, 0, Math.PI * 2);
        context.stroke();
        for (let i = 0; i < 4; i += 1) {
            const angle = i * Math.PI / 2;
            context.beginPath();
            context.moveTo(x + width / 2 + Math.cos(angle) * radius, y + depth / 2 + Math.sin(angle) * radius);
            context.lineTo(x + width / 2 + Math.cos(angle) * radius * 1.45, y + depth / 2 + Math.sin(angle) * radius * 1.45);
            context.stroke();
        }
    }

    drawPlanDoorSplit(x, y, width, depth, count) {
        const context = this.ctx;
        context.strokeRect(x, y, width, depth);
        for (let i = 1; i < count; i += 1) {
            const splitX = x + (width / count) * i;
            context.beginPath();
            context.moveTo(splitX, y);
            context.lineTo(splitX, y + depth);
            context.stroke();
        }
        for (let i = 0; i < count; i += 1) {
            const bayX = x + (width / count) * i;
            const bayW = width / count;
            const handleX = bayX + bayW * 0.72;
            this.drawPlanHandle(handleX, y + depth * 0.32, Math.max(5, depth * 0.34), true);
        }
    }

    drawPlanHandle(x, y, length, vertical = true) {
        const context = this.ctx;
        context.beginPath();
        if (vertical) {
            context.moveTo(x, y);
            context.lineTo(x, y + length);
        } else {
            context.moveTo(x, y);
            context.lineTo(x + length, y);
        }
        context.stroke();
    }

    drawPlanSink(x, y, width, depth, isDouble = false) {
        const context = this.ctx;
        context.strokeRect(x, y, width, depth);
        const basinY = y + depth * 0.22;
        const basinH = depth * 0.52;
        const radius = Math.max(3, Math.min(width, depth) * 0.08);
        if (isDouble) {
            this.drawRoundedPlanRect(x + width * 0.10, basinY, width * 0.36, basinH, radius);
            this.drawRoundedPlanRect(x + width * 0.54, basinY, width * 0.36, basinH, radius);
            this.drawDrainSymbol(x + width * 0.28, basinY + basinH * 0.55, Math.min(width, depth) * 0.035);
            this.drawDrainSymbol(x + width * 0.72, basinY + basinH * 0.55, Math.min(width, depth) * 0.035);
        } else {
            this.drawRoundedPlanRect(x + width * 0.18, basinY, width * 0.64, basinH, radius);
            this.drawDrainSymbol(x + width * 0.5, basinY + basinH * 0.55, Math.min(width, depth) * 0.04);
        }
        context.beginPath();
        context.arc(x + width * 0.5, y + depth * 0.13, Math.max(2, Math.min(width, depth) * 0.035), Math.PI, 0);
        context.stroke();
    }

    drawPlanCooktop(x, y, width, depth) {
        const context = this.ctx;
        this.drawRoundedPlanRect(x, y, width, depth, Math.max(4, Math.min(width, depth) * 0.08));
        const radius = Math.max(3, Math.min(width, depth) * 0.115);
        [
            [0.32, 0.35],
            [0.68, 0.35],
            [0.32, 0.67],
            [0.68, 0.67]
        ].forEach(([cx, cy], index) => {
            context.beginPath();
            context.arc(x + width * cx, y + depth * cy, radius * (index > 1 ? 0.82 : 1), 0, Math.PI * 2);
            context.stroke();
        });
    }

    drawPlanCountertop(x, y, width, depth, palette) {
        const context = this.ctx;
        context.save();
        context.strokeStyle = palette.detail;
        context.fillStyle = this.colorWithAlpha(palette.accent || '#b69b57', 0.18);
        context.fillRect(x, y, width, depth);
        context.strokeRect(x, y, width, depth);
        context.setLineDash([5, 4]);
        for (let i = 1; i < 4; i += 1) {
            context.beginPath();
            context.moveTo(x + (width / 4) * i, y + depth * 0.12);
            context.lineTo(x + (width / 4) * i, y + depth * 0.88);
            context.stroke();
        }
        context.restore();
    }

    drawPlanDrawers(x, y, width, depth, count = 3) {
        const context = this.ctx;
        const drawerCount = Math.max(2, Math.min(4, count));
        context.strokeRect(x, y, width, depth);
        for (let i = 1; i < drawerCount; i += 1) {
            const splitY = y + (depth / drawerCount) * i;
            context.beginPath();
            context.moveTo(x, splitY);
            context.lineTo(x + width, splitY);
            context.stroke();
        }
        for (let i = 0; i < drawerCount; i += 1) {
            const cy = y + (depth / drawerCount) * (i + 0.5);
            this.drawPlanHandle(x + width * 0.32, cy, width * 0.36, false);
        }
    }

    drawPlanShelves(x, y, width, depth, count = 3) {
        const context = this.ctx;
        const shelfCount = Math.max(2, Math.min(5, count));
        context.strokeRect(x, y, width, depth);
        context.setLineDash([3, 3]);
        for (let i = 1; i < shelfCount; i += 1) {
            const splitY = y + (depth / shelfCount) * i;
            context.beginPath();
            context.moveTo(x + width * 0.08, splitY);
            context.lineTo(x + width * 0.92, splitY);
            context.stroke();
        }
        context.setLineDash([]);
    }

    drawPlanCorner(x, y, width, depth, shape = 'l') {
        const context = this.ctx;
        context.strokeRect(x, y, width, depth);
        context.beginPath();
        context.moveTo(x + width * 0.34, y);
        context.lineTo(x + width * 0.34, y + depth * 0.66);
        context.lineTo(x + width, y + depth * 0.66);
        context.stroke();
        if (shape === 'u') {
            context.beginPath();
            context.moveTo(x + width * 0.66, y);
            context.lineTo(x + width * 0.66, y + depth * 0.66);
            context.stroke();
        }
        context.beginPath();
        context.arc(x + width * 0.5, y + depth * 0.5, Math.min(width, depth) * 0.18, Math.PI * 0.1, Math.PI * 1.4);
        context.stroke();
    }

    drawPlanIsland(x, y, width, depth) {
        const context = this.ctx;
        this.drawRoundedPlanRect(x, y, width, depth, Math.max(5, Math.min(width, depth) * 0.08));
        context.beginPath();
        context.moveTo(x + width * 0.16, y + depth * 0.5);
        context.lineTo(x + width * 0.84, y + depth * 0.5);
        context.stroke();
    }

    drawPlanFridge(x, y, width, depth, isDouble = false) {
        const context = this.ctx;
        context.strokeRect(x, y, width, depth);
        if (isDouble) {
            context.beginPath();
            context.moveTo(x + width * 0.5, y);
            context.lineTo(x + width * 0.5, y + depth);
            context.stroke();
            this.drawPlanHandle(x + width * 0.44, y + depth * 0.2, depth * 0.54, true);
            this.drawPlanHandle(x + width * 0.56, y + depth * 0.2, depth * 0.54, true);
        } else {
            context.beginPath();
            context.moveTo(x, y + depth * 0.34);
            context.lineTo(x + width, y + depth * 0.34);
            context.stroke();
            this.drawPlanHandle(x + width * 0.82, y + depth * 0.12, depth * 0.18, true);
            this.drawPlanHandle(x + width * 0.82, y + depth * 0.48, depth * 0.38, true);
        }
    }

    drawPlanAppliance(x, y, width, depth, moduleId = '') {
        const context = this.ctx;
        this.drawRoundedPlanRect(x, y, width, depth, Math.max(3, Math.min(width, depth) * 0.06));
        context.strokeRect(x + width * 0.16, y + depth * 0.22, width * 0.68, depth * 0.48);
        context.beginPath();
        context.moveTo(x + width * 0.22, y + depth * 0.15);
        context.lineTo(x + width * 0.78, y + depth * 0.15);
        context.stroke();
        if (moduleId.includes('dishwasher') || moduleId.includes('sterilizer')) {
            context.beginPath();
            context.moveTo(x + width * 0.24, y + depth * 0.78);
            context.lineTo(x + width * 0.76, y + depth * 0.78);
            context.stroke();
        }
    }

    drawPlanWasher(x, y, width, depth) {
        const context = this.ctx;
        this.drawRoundedPlanRect(x, y, width, depth, Math.max(3, Math.min(width, depth) * 0.06));
        context.strokeRect(x + width * 0.16, y + depth * 0.12, width * 0.68, depth * 0.14);
        context.beginPath();
        context.arc(x + width * 0.5, y + depth * 0.58, Math.min(width, depth) * 0.23, 0, Math.PI * 2);
        context.stroke();
        context.beginPath();
        context.arc(x + width * 0.5, y + depth * 0.58, Math.min(width, depth) * 0.12, 0, Math.PI * 2);
        context.stroke();
    }

    drawPlanHood(x, y, width, depth) {
        const context = this.ctx;
        context.beginPath();
        context.moveTo(x + width * 0.2, y + depth * 0.2);
        context.lineTo(x + width * 0.8, y + depth * 0.2);
        context.lineTo(x + width * 0.65, y + depth * 0.78);
        context.lineTo(x + width * 0.35, y + depth * 0.78);
        context.closePath();
        context.stroke();
        context.beginPath();
        context.moveTo(x + width * 0.5, y + depth * 0.2);
        context.lineTo(x + width * 0.5, y + depth * 0.78);
        context.stroke();
    }

    drawPlanToilet(x, y, width, depth) {
        const context = this.ctx;
        context.strokeRect(x + width * 0.28, y + depth * 0.08, width * 0.44, depth * 0.2);
        context.beginPath();
        context.ellipse(x + width * 0.5, y + depth * 0.58, width * 0.25, depth * 0.3, 0, 0, Math.PI * 2);
        context.stroke();
        context.beginPath();
        context.arc(x + width * 0.5, y + depth * 0.58, Math.min(width, depth) * 0.08, 0, Math.PI * 2);
        context.stroke();
    }

    drawPlanShower(x, y, width, depth, isPartition = false) {
        const context = this.ctx;
        context.strokeRect(x, y, width, depth);
        if (isPartition || depth < width * 0.22 || width < depth * 0.22) {
            context.beginPath();
            context.moveTo(x + width * 0.1, y + depth * 0.5);
            context.lineTo(x + width * 0.9, y + depth * 0.5);
            context.stroke();
            return;
        }
        context.beginPath();
        context.moveTo(x + width * 0.14, y + depth * 0.14);
        context.lineTo(x + width * 0.5, y + depth * 0.5);
        context.lineTo(x + width * 0.86, y + depth * 0.14);
        context.stroke();
        this.drawDrainSymbol(x + width * 0.5, y + depth * 0.72, Math.min(width, depth) * 0.045);
    }

    drawPlanTub(x, y, width, depth) {
        const context = this.ctx;
        this.drawRoundedPlanRect(x, y, width, depth, Math.min(width, depth) * 0.18);
        context.beginPath();
        context.ellipse(x + width * 0.5, y + depth * 0.52, width * 0.36, depth * 0.26, 0, 0, Math.PI * 2);
        context.stroke();
        this.drawDrainSymbol(x + width * 0.78, y + depth * 0.5, Math.min(width, depth) * 0.04);
    }

    drawPlanDrain(x, y, width, depth) {
        this.drawDrainSymbol(x + width * 0.5, y + depth * 0.5, Math.min(width, depth) * 0.18);
    }

    drawPlanWallMountMark(x, y, width, depth, palette) {
        const context = this.ctx;
        context.save();
        context.strokeStyle = palette.accent || palette.detail;
        context.lineWidth = 1;
        context.setLineDash([3, 3]);
        context.beginPath();
        context.moveTo(x + 4, y + 4);
        context.lineTo(x + Math.min(width - 4, 20), y + 4);
        context.stroke();
        context.restore();
    }

    drawRoundedPlanRect(x, y, width, depth, radius = 4) {
        const context = this.ctx;
        const r = Math.max(0, Math.min(radius, width / 2, depth / 2));
        context.beginPath();
        context.moveTo(x + r, y);
        context.lineTo(x + width - r, y);
        context.quadraticCurveTo(x + width, y, x + width, y + r);
        context.lineTo(x + width, y + depth - r);
        context.quadraticCurveTo(x + width, y + depth, x + width - r, y + depth);
        context.lineTo(x + r, y + depth);
        context.quadraticCurveTo(x, y + depth, x, y + depth - r);
        context.lineTo(x, y + r);
        context.quadraticCurveTo(x, y, x + r, y);
        context.stroke();
    }

    drawDrainSymbol(cx, cy, radius = 3) {
        const context = this.ctx;
        const r = Math.max(1.5, radius);
        context.beginPath();
        context.arc(cx, cy, r, 0, Math.PI * 2);
        context.stroke();
        context.beginPath();
        context.moveTo(cx - r * 0.7, cy);
        context.lineTo(cx + r * 0.7, cy);
        context.moveTo(cx, cy - r * 0.7);
        context.lineTo(cx, cy + r * 0.7);
        context.stroke();
    }

    drawSelection(cabinet) {
        const context = this.ctx;
        const footprint = this.getFootprint(cabinet);
        const x = this.offsetX + (cabinet.x / 1000) * this.scale;
        const y = this.offsetY + (cabinet.y / 1000) * this.scale;
        const width = (footprint.width / 1000) * this.scale;
        const depth = (footprint.depth / 1000) * this.scale;
        context.save();
        context.strokeStyle = '#2f6d58';
        context.lineWidth = 2;
        context.setLineDash([5, 3]);
        context.strokeRect(x - 3, y - 3, width + 6, depth + 6);
        context.setLineDash([]);
        context.fillStyle = '#ffffff';
        context.strokeStyle = '#2f6d58';
        [[x, y], [x + width, y], [x, y + depth], [x + width, y + depth]].forEach(([pointX, pointY]) => {
            context.beginPath();
            context.arc(pointX, pointY, 4, 0, Math.PI * 2);
            context.fill();
            context.stroke();
        });
        context.restore();
    }

    drawSmartGuides() {
        const target = this.selectedCabinet || this.getPendingGhost();
        if (!target) return;

        const context = this.ctx;
        const footprint = this.getFootprint(target);
        const x = this.offsetX + (target.x / 1000) * this.scale;
        const y = this.offsetY + (target.y / 1000) * this.scale;
        const width = (footprint.width / 1000) * this.scale;
        const depth = (footprint.depth / 1000) * this.scale;
        const roomRight = this.offsetX + this.roomWidth * this.scale;
        const roomBottom = this.offsetY + this.roomLength * this.scale;
        const cx = x + width / 2;
        const cy = y + depth / 2;

        context.save();
        context.strokeStyle = 'rgba(47, 109, 88, 0.72)';
        context.fillStyle = '#2f6d58';
        context.lineWidth = 1;
        context.setLineDash([4, 4]);

        this.drawGuideLine(cx, this.offsetY, cx, roomBottom);
        this.drawGuideLine(this.offsetX, cy, roomRight, cy);

        const distances = [
            { x1: this.offsetX, y1: y - 18, x2: x, y2: y - 18, label: this.formatMetric(target.x) },
            { x1: x + width, y1: y - 18, x2: roomRight, y2: y - 18, label: this.formatMetric(this.roomWidth * 1000 - target.x - footprint.width) },
            { x1: x - 18, y1: this.offsetY, x2: x - 18, y2: y, label: this.formatMetric(target.y), vertical: true },
            { x1: x - 18, y1: y + depth, x2: x - 18, y2: roomBottom, label: this.formatMetric(this.roomLength * 1000 - target.y - footprint.depth), vertical: true }
        ];
        context.setLineDash([]);
        distances.forEach(item => this.drawDimensionGuide(item));

        const targetEdges = [
            { axis: 'x', value: target.x, screen: x },
            { axis: 'x', value: target.x + footprint.width, screen: x + width },
            { axis: 'y', value: target.y, screen: y },
            { axis: 'y', value: target.y + footprint.depth, screen: y + depth }
        ];
        const snapRange = 50;
        this.cabinets.forEach(cabinet => {
            if (cabinet === target || cabinet.id === target.id) return;
            const other = this.getFootprint(cabinet);
            const otherEdges = [
                { axis: 'x', value: cabinet.x },
                { axis: 'x', value: cabinet.x + other.width },
                { axis: 'y', value: cabinet.y },
                { axis: 'y', value: cabinet.y + other.depth }
            ];
            targetEdges.forEach(edge => {
                otherEdges
                    .filter(otherEdge => otherEdge.axis === edge.axis && Math.abs(otherEdge.value - edge.value) <= snapRange)
                    .forEach(otherEdge => {
                        context.strokeStyle = 'rgba(64, 111, 178, 0.72)';
                        context.setLineDash([8, 4]);
                        if (edge.axis === 'x') this.drawGuideLine(edge.screen, this.offsetY, edge.screen, roomBottom);
                        if (edge.axis === 'y') this.drawGuideLine(this.offsetX, edge.screen, roomRight, edge.screen);
                    });
            });
        });
        context.restore();
    }

    drawGuideLine(x1, y1, x2, y2) {
        const context = this.ctx;
        context.beginPath();
        context.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
        context.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
        context.stroke();
    }

    drawDimensionGuide({ x1, y1, x2, y2, label, vertical = false }) {
        const context = this.ctx;
        if (Math.abs((vertical ? y2 - y1 : x2 - x1)) < 8) return;
        context.strokeStyle = 'rgba(47, 109, 88, 0.75)';
        context.fillStyle = 'rgba(255, 255, 255, 0.92)';
        context.lineWidth = 1;
        this.drawGuideLine(x1, y1, x2, y2);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        context.save();
        context.font = '600 10px Inter, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const textWidth = Math.max(42, context.measureText(label).width + 10);
        if (vertical) {
            context.translate(mx, my);
            context.rotate(-Math.PI / 2);
            context.fillRect(-textWidth / 2, -8, textWidth, 16);
            context.fillStyle = '#2f6d58';
            context.fillText(label, 0, 0);
        } else {
            context.fillRect(mx - textWidth / 2, my - 8, textWidth, 16);
            context.fillStyle = '#2f6d58';
            context.fillText(label, mx, my);
        }
        context.restore();
    }

    drawClearanceChecks(collidingIds) {
        const context = this.ctx;
        const minClearance = 600;
        const issues = [];

        this.cabinets.forEach(cabinet => {
            if (collidingIds.has(cabinet.id)) return;
            const footprint = this.getFootprint(cabinet);
            const wallDistances = [
                cabinet.x,
                cabinet.y,
                this.roomWidth * 1000 - cabinet.x - footprint.width,
                this.roomLength * 1000 - cabinet.y - footprint.depth
            ];
            if (Math.min(...wallDistances) < 20) return;
            const nearby = this.cabinets.some(other => {
                if (other === cabinet || this.getCollisionLayer(other) !== this.getCollisionLayer(cabinet)) return false;
                const otherFootprint = this.getFootprint(other);
                const gapX = Math.max(other.x - (cabinet.x + footprint.width), cabinet.x - (other.x + otherFootprint.width), 0);
                const gapY = Math.max(other.y - (cabinet.y + footprint.depth), cabinet.y - (other.y + otherFootprint.depth), 0);
                const overlapsX = cabinet.x < other.x + otherFootprint.width && cabinet.x + footprint.width > other.x;
                const overlapsY = cabinet.y < other.y + otherFootprint.depth && cabinet.y + footprint.depth > other.y;
                return (overlapsX && gapY > 0 && gapY < minClearance) || (overlapsY && gapX > 0 && gapX < minClearance);
            });
            if (nearby) issues.push(cabinet);
        });

        this.clearanceIssues = issues;
    }

    getPendingGhost() {
        if (!this.pendingModuleId || !this.hoverPoint) return null;
        const ghost = createCabinetInstance(this.pendingModuleId, 0, 0, this.pendingModelVariantId);
        if (!ghost) return null;
        const roomPoint = this.getRoomPoint(this.hoverPoint);
        const footprint = this.getFootprint(ghost);
        const placed = this.clampCabinetPosition(ghost, roomPoint.x - footprint.width / 2, roomPoint.y - footprint.depth / 2);
        ghost.x = placed.x;
        ghost.y = placed.y;
        return ghost;
    }

    drawDimensions() {
        const context = this.ctx;
        const width = this.roomWidth * this.scale;
        const length = this.roomLength * this.scale;
        context.save();
        context.fillStyle = '#59635d';
        context.font = '600 11px Inter, sans-serif';
        context.textAlign = 'center';
        context.fillText(`${this.roomWidth.toFixed(1)} m`, this.offsetX + width / 2, this.offsetY - 14);
        context.translate(this.offsetX - 18, this.offsetY + length / 2);
        context.rotate(-Math.PI / 2);
        context.fillText(`${this.roomLength.toFixed(1)} m`, 0, 0);
        context.restore();
    }

    drawPlacementPreview() {
        const module = findCabinetModule(this.pendingModuleId);
        if (!module) return;
        const ghost = this.getPendingGhost();
        if (!ghost) return;
        const footprint = this.getFootprint(ghost);

        const context = this.ctx;
        const x = this.offsetX + (ghost.x / 1000) * this.scale;
        const y = this.offsetY + (ghost.y / 1000) * this.scale;
        const width = (footprint.width / 1000) * this.scale;
        const depth = (footprint.depth / 1000) * this.scale;
        context.save();
        context.globalAlpha = 0.58;
        this.drawCabinet(ghost, false);
        context.globalAlpha = 1;
        context.strokeStyle = '#2f6d58';
        context.lineWidth = 2;
        context.setLineDash([7, 4]);
        context.strokeRect(x - 4, y - 4, width + 8, depth + 8);
        context.fillStyle = 'rgba(31, 36, 33, 0.82)';
        context.fillRect(x, y - 27, Math.max(118, module.name.length * 12), 22);
        context.fillStyle = '#fff';
        context.font = '600 11px Inter, sans-serif';
        context.textAlign = 'left';
        context.fillText(`点击放置 ${module.name}`, x + 8, y - 12);
        context.restore();
    }

    getData() {
        return {
            roomWidth: this.roomWidth,
            roomLength: this.roomLength,
            cabinets: this.captureCabinets(),
            walls: this.captureWalls(),
            surfaceMaterials: { ...this.surfaceMaterials }
        };
    }

    loadData(data) {
        const width = Number(data.roomWidth);
        const length = Number(data.roomLength);
        if (!Number.isFinite(width) || !Number.isFinite(length) || !Array.isArray(data.cabinets)) {
            throw new Error('方案数据格式无效');
        }
        this.roomWidth = Math.max(1, Math.min(10, width));
        this.roomLength = Math.max(1, Math.min(10, length));
        this.restoreSnapshot(data.cabinets);
        this.walls = Array.isArray(data.walls) ? data.walls.map(wall => ({ ...wall })) : [];
        this.surfaceMaterials = {
            floor: 'marble-white',
            wall: 'marble-white',
            ...(data.surfaceMaterials || {})
        };
        this.undoStack = [];
        this.redoStack = [];
        this.fitToRoom();
        this.selectCabinet(null);
        this.emitHistory();
        this.emitUpdate();
    }
}
