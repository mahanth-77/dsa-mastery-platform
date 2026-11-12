export interface StudyFrame {
  concept: string;
  recognize: string;
  useWhen: string;
  avoidWhen: string;
  mistake: string;
  complexity: string;
}

const FRAMES: Record<string, StudyFrame> = {
  'pattern-01': {
    concept: 'Store a fact about values you have already seen, or walk the array while updating a small amount of state.',
    recognize: 'The question asks for counts, pairs, frequencies, or a single pass that updates a running answer.',
    useWhen: 'A hash map, frequency count, prefix array, or in-place scan removes a nested search.',
    avoidWhen: 'The bottleneck is a range that must be queried in sublinear time, or a graph search.',
    mistake: 'Using a map because the title mentions counts when a sorted two-pointer scan is the actual step.',
    complexity: 'A map of the input is usually linear time and linear extra memory. Confirm the key set before you claim O(1) space.',
  },
  'pattern-02': {
    concept: 'Move two indexes inward, in the same direction, or at different speeds.',
    recognize: 'The array is sorted, you need a pair with a sum or difference, or a linked list needs a midpoint.',
    useWhen: 'Each pointer only moves one way, so the scans add up to a linear pass after any required sort.',
    avoidWhen: 'Every pair of a subarray must be examined and the pointers would reset without a bound.',
    mistake: 'Calling a nested restarted scan O(n) because each inner while looks short.',
    complexity: 'One inward scan is linear. A scan restarted for every index is quadratic. A sort, if present, is separate.',
  },
  'pattern-03': {
    concept: 'Grow a window with the right end and shrink it from the left while a constraint stays valid.',
    recognize: 'You want the longest or shortest subarray whose property can be updated by adding and removing one end.',
    useWhen: 'The left endpoint never moves backward, so the total shrink work is linear.',
    avoidWhen: 'The best window is an arbitrary pair of indexes with no expandable property.',
    mistake: 'Shrinking with an array shift and still claiming a linear bound. The shift copies the window.',
    complexity: 'If both ends only move forward, the window is O(n). The extra memory is whatever the constraint stores.',
  },
  'pattern-04': {
    concept: 'Replace a range question with a difference of prefix values, or record range updates in a difference array.',
    recognize: 'Many subarray sums, remainder counts, or range increments are asked.',
    useWhen: 'The prefix, or a map of prefixes, answers each query in constant or logarithmic time after one build.',
    avoidWhen: 'The array changes between queries in a way a plain prefix cannot repair.',
    mistake: 'Treating a parity mask or a modulo class as an ordinary sum without saying which state is stored.',
    complexity: 'Building the prefix is linear. A fixed domain such as 26 letters or a bounded year range is constant extra memory.',
  },
  'pattern-05': {
    concept: 'Cut a sorted search range in half, or binary-search the answer and test it.',
    recognize: 'A predicate stays false and then stays true, or the data is sorted and you need a boundary.',
    useWhen: 'Each probe is correct and the range shrinks by half.',
    avoidWhen: 'The predicate is not monotonic. Binary search then returns an arbitrary side.',
    mistake: 'Writing O(log n) when each probe scans the whole input. The probe cost multiplies the log.',
    complexity: 'Search on n sorted items is O(log n) probes. Search on a numeric answer A with an O(n) test is O(n log A).',
  },
  'pattern-06': {
    concept: 'Use a stack so the most recent unmatched value is the next one you compare.',
    recognize: 'Matching pairs, previous greater values, or histogram spans.',
    useWhen: 'Each index is pushed once and popped once.',
    avoidWhen: 'You need the minimum across an arbitrary window and a stack cannot drop expired indexes.',
    mistake: 'A nested pop loop is not automatically quadratic. Count pushes, not the look of the while.',
    complexity: 'One push and one pop per index is linear time. The stack holds indexes still waiting, so the extra memory is O(n) in the worst case.',
  },
  'pattern-07': {
    concept: 'Change next pointers, or walk a list with two speeds.',
    recognize: 'Reverse a portion, remove a node, detect a cycle, or merge sorted lists.',
    useWhen: 'Each node is visited a constant number of times and the edits are local.',
    avoidWhen: 'The list has a cycle and the walk has no visited mark or speed difference.',
    mistake: 'Counting the new output nodes as free extra memory, or ignoring a recursive helper such as gcd.',
    complexity: 'A single walk is linear. Extra memory is O(1) only when you do not allocate a structure proportional to the list.',
  },
  'pattern-08': {
    concept: 'Keep the current best candidates in a heap so the root is the next choice.',
    recognize: 'Top-k, streaming kth, or repeatedly extracting the smallest ready item.',
    useWhen: 'You need the best of a changing set and a full sort of every intermediate state is wasteful.',
    avoidWhen: 'You sort the whole input once and never update the order. That is a sort, not a heap.',
    mistake: 'Quoting only the cost of one sift and forgetting the loop that builds or drains the heap.',
    complexity: 'One sift is O(log n). Building n entries is O(n log n) with repeated pushes. The heap stores the entries it holds.',
  },
  'pattern-09': {
    concept: 'Sort intervals and then sweep them in endpoint order.',
    recognize: 'Merge overlaps, count active intervals, or take the next interval that starts after the current end.',
    useWhen: 'Sorting by start or end makes the later scan one pass.',
    avoidWhen: 'The choice depends on a value inside the interval that sorting the endpoints does not order.',
    mistake: 'Forgetting the sort and calling the later linear scan the whole cost.',
    complexity: 'Sort is O(n log n). A sweep that moves an index only forward is linear after that. A heap of active ends adds a log factor.',
  },
  'pattern-10': {
    concept: 'Walk a tree by children, levels, or a binary-search-tree order, carrying only the state the question needs.',
    recognize: 'The input is a root and the answer depends on subtrees, a path, or a level.',
    useWhen: 'Each node is entered once, or a binary search tree discards one side.',
    avoidWhen: 'You restart a full traversal from every node without a reason.',
    mistake: 'Writing O(height) time for a walk that still visits every node. Height is the stack, not the visit count.',
    complexity: 'A full walk is O(n). The recursion stack is O(height), which is O(n) on a skewed tree.',
  },
  'pattern-11': {
    concept: 'Search a graph from a start set, or maintain components.',
    recognize: 'Reachability, shortest paths, cycles, or connectivity.',
    useWhen: 'Each vertex and edge is processed a small number of times.',
    avoidWhen: 'An unweighted grid is searched with a heavy priority queue for no reason, or a visited set is missing.',
    mistake: 'Calling a grid search O(n) when n is the side length. The cells are n by n.',
    complexity: 'BFS or DFS is O(vertices + edges). A heap-based shortest path adds a log factor for the heap operations.',
  },
  'pattern-12': {
    concept: 'Build candidates one choice at a time and undo the choice.',
    recognize: 'Subsets, permutations, or a constraint that can be checked on a partial answer.',
    useWhen: 'The search tree is the solution space and pruning is optional.',
    avoidWhen: 'A direct formula or a greedy exchange already decides the answer.',
    mistake: 'Writing O(branch^depth) without naming the branch count and the depth.',
    complexity: 'State the number of calls and the work per call. Output storage is separate from the recursion stack.',
  },
  'pattern-13': {
    concept: 'Make the locally best choice that an exchange argument says you never need to undo.',
    recognize: 'Sorting unlocks the choice, or a reachability window expands by a local jump.',
    useWhen: 'You can say why an unused candidate cannot improve the answer.',
    avoidWhen: 'The best choice depends on a later combination you have not bounded.',
    mistake: 'Sorting and then calling the algorithm constant time because the scan after the sort is short.',
    complexity: 'The sort dominates when the later scan is linear. Name both.',
  },
  'pattern-14': {
    concept: 'Store the answer for a smaller state and reuse it.',
    recognize: 'Overlapping subproblems and a clear state, such as an index, a capacity, or an interval.',
    useWhen: 'The same state would otherwise be solved many times.',
    avoidWhen: 'The states do not overlap. That is search, not DP.',
    mistake: 'Dropping a dimension. Dice, faces, and target are three factors if the loops use all three.',
    complexity: 'Time follows the number of states times the work inside each state. The table is the extra memory.',
  },
  'pattern-15': {
    concept: 'Use bits as a set or as an algebraic value.',
    recognize: 'Parity, unique numbers, subsets of a small universe, or a fixed word size.',
    useWhen: 'A mask or XOR identity answers the question without scanning pairs.',
    avoidWhen: 'The bit trick is only a constant-time formula on a machine word and you still write O(log n) for a loop that is not there.',
    mistake: 'Treating a 32-bit loop as O(1) without saying the word size, or the reverse.',
    complexity: 'A pass over n values is O(n). A loop over a fixed 32 bits is O(32 n). Enumerating masks is exponential in the mask length.',
  },
  'pattern-16': {
    concept: 'Match strings by a trie, a prefix function, or a direct scan whose cost you can name.',
    recognize: 'Prefixes, dictionary words, or many pattern checks against a text.',
    useWhen: 'Shared prefixes or a linear scan of the text avoid checking every pair from scratch.',
    avoidWhen: 'The code sorts strings or copies suffixes and you still quote a trie bound.',
    mistake: 'Calling slice-based word movement linear when each slice copies the remaining word.',
    complexity: 'Count characters inserted or compared. Copied suffixes add a quadratic term.',
  },
  'pattern-17': {
    concept: 'Answer range queries with a tree or an ordered index instead of scanning the range.',
    recognize: 'Point updates plus prefix sums, or order statistics.',
    useWhen: 'A Fenwick or segment walk is logarithmic in the coordinate size.',
    avoidWhen: 'You only need one static prefix and never update it.',
    mistake: 'Forgetting that each query walks O(log size) and that the tree stores every coordinate.',
    complexity: 'A low-bit walk is O(log size). Building one entry per coordinate is linearithmic if each insert walks the tree.',
  },
  'pattern-18': {
    concept: 'Turn the question into a recurrence and evaluate it from the base case.',
    recognize: 'A smaller instance of the same problem is the whole step, as in a digit, a power, or a tree node.',
    useWhen: 'The recurrence reduces the argument and memoization, if present, stops repeated calls.',
    avoidWhen: 'The recursive call does not shrink the argument and there is no memo.',
    mistake: 'Ignoring the work inside each call, such as a loop that doubles an index on every level.',
    complexity: 'Count calls and work per call. The stack depth follows the longest chain of calls.',
  },
  'pattern-19': {
    concept: 'Use number structure: divisors, gcd, primes, or a closed count.',
    recognize: 'The answer depends on factors, residues, or a formula in the numeric value.',
    useWhen: 'Trial division, a sieve, or Euclidean gcd matches the question.',
    avoidWhen: 'You hide an unbounded search behind a formula you have not proved.',
    mistake: 'Pricing one factorization and forgetting the outer loop that repeats it.',
    complexity: 'Trial division of n is O(sqrt n). A sieve to R is about O(R log log R). Euclidean gcd is O(log n) stack in this runtime.',
  },
  'pattern-20': {
    concept: 'Model arrival order with a queue or a circular count.',
    recognize: 'People or tasks are served from the front and may return to the back.',
    useWhen: 'The simulation visits each step the process actually performs.',
    avoidWhen: 'A direct count replaces the simulation. Do not call the count a queue.',
    mistake: 'Using a rotating array and quoting a linear bound when each rotation copies the line.',
    complexity: 'A queue operation is O(1). The total is the number of operations the process performs.',
  },
  'pattern-21': {
    concept: 'The solution needs two techniques together, and both must be visible in the code.',
    recognize: 'A prefix plus a hash, a search plus a feasibility test, or a tree walk plus a path value.',
    useWhen: 'Removing either technique leaves the problem unsolved.',
    avoidWhen: 'One of the two names is only a helper and the other variation already teaches the real step.',
    mistake: 'Placing the same solution in both combined variations without a different mechanism.',
    complexity: 'Add the costs. A sort plus a binary search on a value range is not just the search.',
  },
};

export function studyFrame(patternId: string, variationName: string): StudyFrame {
  const frame = FRAMES[patternId] || {
    concept: variationName,
    recognize: 'Match the variation name to the step the code actually repeats.',
    useWhen: 'The variation name is the main step, not a side structure.',
    avoidWhen: 'A sibling variation names that step more directly.',
    mistake: 'Solving the title without checking which variation you are practicing.',
    complexity: 'Derive the bound from the loops you wrote. The tracker does not store one.',
  };
  return frame;
}
