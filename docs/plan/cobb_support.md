Goal: support COBB data log files

sample input data: @input/cobb_datalog2.csv

steps:
1. analyze data structure and create structure md file similar to @docs/OBD2_DATA_STRUCTURE.md
2. compare with current OBD2 data structure and see difference in attributes
3. check if new cobb data can plot all existing plots
4. check if additional plots can be created
   1. if yes i think it would be better to create a profile system, marrying set of attributes to graphs to be plotted, this needs to be explored further (local storage or db)
5. create new parsing methods for new cobb dataset
6. try plotting new plots with new cobb dataset

questions:
1. is it better to ask user to select data profile (where data is coming from, currently data is from obdlink and cobb) or auto detect? or both?
2. for profile system is it better to
   1. attributes to plots
      1. seems this is better as even same car can have different attributes
   2. car to plots
      1. this would require user to input what car they are driving
3. at this scale, would a database be beneficial?

ask clarification questions