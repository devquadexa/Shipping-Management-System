/**
 * Category Domain Entity
 * Represents a business category
 */
class Category {
  constructor({
    categoryId,
    categoryName
  }) {
    this.categoryId = categoryId;
    this.categoryName = categoryName;
  }
}

module.exports = Category;
