import { Injectable } from '@angular/core';
import * as math from 'mathjs';

@Injectable({
  providedIn: 'root'
})
export class OptimalTradeService {

  constructor() { }

  optimize() {
    const offeredValue1 = 237;
    const searchedValue1 = 12345;
    const offeredValue2 = 295;
    const searchedValue2 = 12368;
    const offeredValue3 = 52531;
    const searchedValue3 = 4787;
    const demandForSearchedValue = 3000;

    // create the linear constraint object
    const lc = {
      type: 'eq',
      lhs: [1, 1, 1],
      rhs: [demandForSearchedValue],
    };

    // define the objective function
    function objective_function(x: number[]) {
      const [x1, x2, x3] = x;
      return (
        offeredValue1 * searchedValue1 * (searchedValue2 - x2) * (searchedValue3 - x3) +
        offeredValue2 * searchedValue2 * (searchedValue1 - x1) * (searchedValue3 - x3) +
        offeredValue3 * searchedValue3 * (searchedValue1 - x1) * (searchedValue2 - x2) -
        (offeredValue1 + offeredValue2 + offeredValue3) * (searchedValue1 - x1) * (searchedValue2 - x2) * (searchedValue3 - x3)
      );
    }

    // define the bounds for x, y, and z
    const bounds = math.matrix([
      [0, searchedValue1],
      [0, searchedValue2],
      [0, searchedValue3],
    ]);

    // perform the optimization
    const result = math.optimize(
      objective_function,
      bounds,
      lc,
      { method: 'differential-evolution', maxIter: 1000 }
    );

    // return the result
    return result.solution;
  }
}
