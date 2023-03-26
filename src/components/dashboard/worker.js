class DashboardWorker {
    getCollision(w, widgets) {
        return widgets.reduce((res, ww) => {
            ((w.y < ww.y + ww.h && w.y + w.h > ww.y) && (w.x < ww.x + ww.w && w.x + w.w > ww.x)) &&
            res.push(ww);
            return res;
        }, []);
    }

    getFreePlace(w, widgets, tableWidth) {
        if (w.w > tableWidth) {
            console.warn(`Error: widget '${w.id} width (${w.w}) > table width (${tableWidth})'`);
            return w;
        }

        let maxRightPosition = tableWidth - w.w;
        for (let y = 0; y < 0xFFFFFF; y++) {
            for (let x = 0; x <= maxRightPosition; x++) {
                w.x = x;
                w.y = y;
                if (!this.getCollision(w, widgets).length) return w;
            }
        }

        return w;
    }

    getTableHeight(widgets) {
        let height = 0;
        widgets.forEach((widget) => {
            let widgetBottom = widget.y + widget.h;
            if (widgetBottom > height) {
                height = widgetBottom;
            }
        });
        return height;
    }

    // Send new widgets coordinates
    moveWidgets(widgets, deferId, widget) {
        let allWidgets = widgets.slice();
        widget && allWidgets.push(widget);

        globalThis.postMessage({
            com        : 'moveWidgets',
            widgets,
            deferId,
            tableHeight: this.getTableHeight(allWidgets)
        });
    }

    //Sort widgets by position
    sortWidgets(widgets, tableWidth) {
        widgets.sort((a, b) => {
            let aa = a.y * tableWidth + a.x;
            let bb = b.y * tableWidth + b.x;
            if (aa === bb) return 0;
            return aa < bb ? -1 : 1;
        });
    }

    constructor() {
        let handlers = {
            // Get collisions between widgets
            getCollision(data) {
                let collided;
                if ((collided = this.getCollision(data.widget, data.widgets)).length) {
                    collided.forEach((widget) => {
                        this.getFreePlace(
                            widget,
                            data.widgets.filter(w => w !== widget).concat([data.widget]),
                            data.tableWidth
                        );
                    });
                }
                return this.moveWidgets(data.widgets, data.deferId, data.widget);
            },

            // Find free place for given widget
            getFreePlace(data) {
                this.moveWidgets(
                    [this.getFreePlace(data.widget, data.widgets, data.tableWidth)],
                    data.deferId,
                    data.widget
                );
            },

            // Close gaps between all widgets
            arrangeWidgets(data) {
                this.sortWidgets(data.widgets, data.tableWidth);
                let sliceIndex = data.widget ?
                                 data.widgets.indexOf(data.widgets.find(w => w.id === data.widget.id)) :
                                 0,
                    widgets    = data.widgets.slice(0, sliceIndex);
                for (let widgetIndex = sliceIndex; widgetIndex < data.widgets.length; widgetIndex++) {
                    widgets.push(this.getFreePlace(data.widgets[widgetIndex], widgets, data.tableWidth));
                }
                this.moveWidgets(widgets.slice(sliceIndex), data.deferId, data.widget);
            }
        };

        globalThis.addEventListener('message', ((event) => {
            let data = event.data;
            handlers[data.com] && handlers[data.com].call(this, data);
        }));
    }
}

new DashboardWorker();
