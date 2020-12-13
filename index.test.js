const searchCol = require('./index')


test("should return the column of the square given", () => {
    expect(searchCol(187)).toBe(11)
})