/** 
 * @typedef {Object} WorkshopSettings 
 * @property {boolean} createStaticShapes
 * @property {number} closePolylineThreshold
 * @property {GridSettings} gridSettings
 */

/**
 * @typedef {Object} GridSettings
 * @property {number} spacing
 * @property {Coords2D} offset
 * @property {boolean} snap
 */

export const WorkshopDefaultSettings = {
    createStaticShapes: false,
    closePolylineThreshold: 20, //px
    gridSettings: {
        spacing: 50,
        offset: [0, 0],
        snap: false
    },
}